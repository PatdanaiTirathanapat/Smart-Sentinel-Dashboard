"use client";

import React, { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { realtimeDB } from "../libs/firebase";

interface SensorPayload {
  hit_alert?: number;
  motion_alert?: number;
  system_alert?: number;
  [key: string]: any;
}

export default function DashboardPage() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sensorData, setSensorData] = useState<SensorPayload>({});

  useEffect(() => {
    // path in firebase realtime database: devices/sensor_node/state
    const dataRef = ref(realtimeDB, "devices/sensor_node/state");

    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Firebase result:", data);
      setSensorData(data || {});
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="dashboard-body">
      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <i className="sidebar-logo-icon">👁️</i>
            <span className="sidebar-logo-text">Smart Sentinel</span>
          </div>

          <nav className="sidebar-nav">
            <ul>
              <li>
                <a className="nav-link active">
                  <i>📊</i> Dashboard
                </a>
              </li>
            </ul>
          </nav>

          <footer className="sidebar-footer">Smart Sentinel © 2025</footer>
        </aside>

        {/* Main Content */}
        <main className="main-content center-content">
          <section className="system-toggle-section">
            <h1>System Control</h1>
            <p className="control-description">
              เปิด/ปิด ระบบตรวจจับ พร้อมแสดงข้อมูลสดจาก Firebase
            </p>

            <label className="toggle-switch-container">
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => setIsActive(!isActive)}
              />
              <span className="toggle-slider round"></span>
            </label>

            <div className={`status-indicator ${isActive ? "active" : "inactive"}`}>
              <i>{isActive ? "🟢" : "🔴"}</i>
              {isActive ? "ACTIVE" : "INACTIVE"}
            </div>

            {/* Firebase Real-time data */}
            <div style={{ marginTop: 40, textAlign: "left" }}>
                <h3>📡 Sensor Data (Firebase)</h3>

                    <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginTop: 20 }}>
                        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                            <h4>🚨 Hit Alert</h4>
                            <p style={{ fontSize: 24, fontWeight: "bold" }}>{sensorData.hit_alert ?? "-"}</p>
                        </div>

                        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                            <h4>🏃 Motion Alert</h4>
                            <p style={{ fontSize: 24, fontWeight: "bold" }}>{sensorData.motion_alert ?? "-"}</p>
                        </div>

                        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                            <h4>⚠️ System Alert</h4>
                            <p style={{ fontSize: 24, fontWeight: "bold" }}>{sensorData.system_alert ?? "-"}</p>
                        </div>

                        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                            <h4>🌡️ Temperature (°C)</h4>
                            <p style={{ fontSize: 24, fontWeight: "bold" }}>{sensorData.temp_c ?? "-"}</p>
                        </div>
                    </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}