"use client";

import React, { useEffect, useState } from "react";
import { onValue, ref, update } from "firebase/database";
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
  timestamp: Timestamp;
  source: string; 
  [key: string]: any;
}

// function to format the timestamp
const formatTimestamp = (firestoreTimestamp: Timestamp | null) => {
    if (!firestoreTimestamp) return "-";
    const date = firestoreTimestamp.toDate();
    return date.toLocaleString();
};

export default function DashboardPage() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sensorData, setSensorData] = useState<SensorPayload>({});
  const [latestImageUrl, setLatestImageUrl] = useState<string | null>(null);
  const [latestTimestamp, setLatestTimestamp] = useState<Timestamp | null>(null); 

  useEffect(() => {
    // path in firebase realtime database: devices/sensor_node/state
    const dataRef = ref(realtimeDB, "devices/sensor_node/state");

    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      setSensorData(data || {});
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function loadLatestLog() {
      const colRef = collection(firestoreDB, "logs");
      const snapshot = await getDocs(colRef);

      const allItems: LogItem[] = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as LogItem));

      // Filter logs to include only "MQTT_Trigger_Camera" source**
      const filteredCameraLogs = allItems
        .filter(log => log.source === "MQTT_Trigger_Camera");
      // Sort the filtered logs descending by timestamp (latest first)**
      const latestCameraLogs = filteredCameraLogs
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

      if (latestCameraLogs.length > 0 && latestCameraLogs[0]?.imageUrl) {
        setLatestImageUrl(latestCameraLogs[0].imageUrl);
        setLatestTimestamp(latestCameraLogs[0].timestamp);
      } else {
        setLatestImageUrl(null);
        setLatestTimestamp(null);
      }
    }

    loadLatestLog();
  }, []);

  //ARMED/DISARMED
  useEffect(() => {
    const stateRef = ref(realtimeDB, "devices/gateway_node/state/arm_state");
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const armState = snapshot.val();
      if (armState === "ARMED") {
        setIsActive(true);
      } else if (armState === "DISARMED") {
        setIsActive(false);
      }
    });
    return () => unsubscribe();
  }, []);


  return (
    <div className="dashboard-body">
      <div className="dashboard-container">
        {/*Sidebar Component */}
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
                onChange={(e) => {
                  const newState = e.target.checked;
                  setIsActive(newState);
                  const stateRef = ref(realtimeDB, "devices/gateway_node/state");
                  update(stateRef, {
                    arm_state: newState ? "ARMED" : "DISARMED"
                  });
                }}
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

          {/* Firestore database picture */}
          <section style={{ marginTop: 40 }}>
            <h3>🖼️ Latest Incident Snapshot</h3>
            {latestImageUrl ? (
              <>
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
              <p>No latest camera image available.</p>
              )}
          </section>


        </main>
      </div>
    </div>
  );
}