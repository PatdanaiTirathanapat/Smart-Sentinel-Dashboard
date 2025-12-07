"use client";

import React, { useEffect, useState } from "react";
import { onValue, ref, update } from "firebase/database";
import { realtimeDB, firestoreDB, auth } from "../libs/firebase";
import { collection, getDocs, Timestamp, onSnapshot,query,where,orderBy,limit} from "firebase/firestore"; 
import Sidebar from "../components/Sidebar"; 
import { signInWithEmailAndPassword, onAuthStateChanged, User } from "firebase/auth";
import {type QuerySnapshot,type DocumentData} from "firebase/firestore";

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Firebase Authentication Login
  useEffect(() => {
    // ฟังสถานะ Auth ตลอดเวลา
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        // ถ้ายังไม่มี User ให้สั่ง Login
        signInWithEmailAndPassword(auth, "smart.sentinel@gmail.com", "123456")
          .catch((err) => console.error("❌ Login failed:", err));
      }
    });

    return () => unsubscribeAuth();
  }, []);

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
    if (!currentUser) return; 

    const logsRef = collection(firestoreDB, "logs");

    // 1. ดึงข้อมูลล่าสุดมา "เผื่อ" ไว้เยอะหน่อย (เช่น 20 ตัว) 
    // โดยยังไม่ต้องสนใจว่า Source คืออะไร เอาเรียงตามเวลามาก่อน
    const q = query(
      logsRef,
      orderBy("timestamp", "desc"),
      limit(20) // ดึงมา 20 ตัวล่าสุด (เผื่อมี sensor อื่นแทรกมาเยอะๆ)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // 2. ใช้ JavaScript วนหา document ตัวแรกที่มีคำว่า "Camera" ใน source
        const cameraDoc = snapshot.docs.find(doc => {
            const data = doc.data() as any;
            // เช็คว่ามี field source และในคำนั้นมีคำว่า "Camera" ผสมอยู่ไหม (includes)
            return data.source && data.source.toString().includes("Camera");
        });

        if (cameraDoc) {
             const data = cameraDoc.data() as any;
             setLatestImageUrl(data.imageUrl || null);
             setLatestTimestamp(data.timestamp || null);
        } 

        

      } else {
        setLatestImageUrl(null);
        setLatestTimestamp(null);
      }
    }, (error) => {
        console.error("❌ Firestore Error:", error);
    });

    return () => unsub();
  }, [currentUser]);

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
                <h3>📡 Sensor Data (Realtime)</h3>
            </div>

            <div className="sensor-grid">

              {/* Motion Alert */}
              <div className="sensor-card">
                <h4 className="sensor-title">🚶 Motion Alert</h4>
                <p
                  className={`sensor-value ${
                    sensorData.motion_alert === 1 ? "alert-value" : ""
                  }`}
                >
                  {sensorData.motion_alert ?? "-"}
                </p>
              </div>

              {/* Hit Alert */}
              <div className="sensor-card">
                <h4 className="sensor-title">💥 Hit Alert</h4>
                <p
                  className={`sensor-value ${
                    sensorData.hit_alert === 1 ? "alert-value" : ""
                  }`}
                >
                  {sensorData.hit_alert ?? "-"}
                </p>
            </div>

              {/* Fire Alert */}
              <div className="sensor-card">
                <h4 className="sensor-title">🔥 Fire Alert</h4>
                <p
                  className={`sensor-value ${
                    sensorData.fire_alert === 1 ? "alert-value" : ""
                  }`}
                >
                  {sensorData.fire_alert ?? "-"}
                </p>
              </div>

              {/* Temperature °C */}
              <div className="sensor-card">
                <h4 className="sensor-title">🌡️ Temperature (°C)</h4>
                <p
                  className={`sensor-value ${
                    sensorData.temp_c != null && sensorData.temp_c >= 50
                      ? "alert-value"
                      : ""
                  }`}
                >
                  {sensorData.temp_c ?? "-"}
              </p>
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

