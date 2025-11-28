"use client";

import React, { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { realtimeDB } from "../libs/firebase";
import { firestoreDB } from "../libs/firebase";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import Sidebar from "../components/Sidebar";

interface SensorPayload {
  hit_alert?: number;
  motion_alert?: number;
  system_alert?: number;
  temp_c?: number;
  [key: string]: any;
}

interface LogItem {
  id: string;
  imageUrl: string;
  timestamp: Timestamp; // Assume timestamp is a Firestore Timestamp object
  [key: string]: any;
}

// Helper function to format the timestamp
const formatTimestamp = (firestoreTimestamp: Timestamp | null) => {
    if (!firestoreTimestamp) return "-";
    const date = firestoreTimestamp.toDate();
    return date.toLocaleString(); // Format to locale string
};


export default function DashboardPage() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sensorData, setSensorData] = useState<SensorPayload>({});
  const [latestImageUrl, setLatestImageUrl] = useState<string | null>(null);
  // **FIX: 1. เพิ่ม state สำหรับเก็บ timestamp ล่าสุด**
  const [latestTimestamp, setLatestTimestamp] = useState<Timestamp | null>(null); 


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

  useEffect(() => {
    async function loadLatestLog() {
      const colRef = collection(firestoreDB, "logs");
      const snapshot = await getDocs(colRef);

      const items: LogItem[] = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as LogItem))
        // Sort descending by timestamp (latest first)
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

      if (items.length > 0 && items[0]?.imageUrl) {
        // **FIX: 2. เก็บทั้ง URL และ Timestamp ล่าสุด**
        setLatestImageUrl(items[0].imageUrl);
        setLatestTimestamp(items[0].timestamp);
      } else {
        setLatestImageUrl(null);
        setLatestTimestamp(null);
      }
    }

    loadLatestLog();
  }, []);


  return (
    <div className="dashboard-body">
      <div className="dashboard-container">
        <Sidebar activePath="/" />

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
            <div style={{ marginTop: 40, textAlign: "center" }}>
                <h3>📡 Sensor Data (Firebase)</h3>
            </div>
            <div className="sensor-grid">          
                {/* Motion Alert */}
                <div className="sensor-card">
                    <h4 className="sensor-title">🚶 Motion Alert</h4>
                    <p className="sensor-value">{sensorData.motion_alert ?? "-"}</p>
                </div>

                {/* Hit Alert */}
                <div className="sensor-card">
                    <h4 className="sensor-title">💥 Hit Alert</h4>
                    <p className="sensor-value">{sensorData.hit_alert ?? "-"}</p>
                </div>

                {/* System Alert */}
                <div className="sensor-card">
                    <h4 className="sensor-title">⚠️ System Alert</h4>
                    <p className="sensor-value">{sensorData.system_alert ?? "-"}</p>
               </div>

            {/* Temperature (°C) */}
            <div className="sensor-card">
                <h4 className="sensor-title">🌡️ Temperature (°C)</h4>
                <p className="sensor-value">{sensorData.temp_c ?? "-"}</p>
            </div>
        </div>

          </section>

          <section style={{ marginTop: 40 }}>
            <h3>🖼️ Latest Incident Snapshot</h3>
            {latestImageUrl ? (
              <>
                {/* **FIX: 3. แสดง Timestamp ล่าสุด** */}
                <p style={{ marginBottom: 10, fontSize: '0.9em', color: '#555' }}>
                    Last Updated: {formatTimestamp(latestTimestamp)}
                </p>

                <img
                    src={latestImageUrl}
                    alt="Latest Incident Snapshot"
                    style={{
                        width: "100%",
                        maxWidth: 400,
                        maxHeight: 300,
                        objectFit: "contain",
                        borderRadius: 12,
                        marginTop: 10,
                    }}
                />
              </>
            ) : (
              <p>No image available.</p>
              )}
          </section>


        </main>
      </div>
    </div>
  );
}