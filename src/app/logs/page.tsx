// src/app/logs/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { firestoreDB } from "../../libs/firebase";
import Sidebar from "../../components/Sidebar"; 

interface LogItem {
  id: string;
  imageUrl: string;
  timestamp: Timestamp;
  source: string; 
  [key: string]: any;
}

// Helper function to format the timestamp
const formatTimestamp = (firestoreTimestamp: Timestamp) => {
  if (!firestoreTimestamp) return "-";
  const date = firestoreTimestamp.toDate(); 
  return date.toLocaleString();
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  // **FIX 1: State เพื่อเก็บ id ของ Log ที่กำลังถูกเปิดดูรูปภาพ**
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null); 

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const colRef = collection(firestoreDB, "logs");
      const snapshot = await getDocs(colRef);

      const allItems: LogItem[] = snapshot.docs
        .map((doc: any) => ({ 
            id: doc.id, 
            ...doc.data() 
        } as LogItem))
        // Filter logs based on the 'source' field
        .filter(log => log.source === "MQTT_Trigger_Camera");


      const filteredAndSortedItems = allItems
        // Sort descending by timestamp (latest first)
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()); 

      setLogs(filteredAndSortedItems);
      setLoading(false);
    }

    loadLogs();
  }, []);

  // **FIX 2: ฟังก์ชันสำหรับสลับการแสดงผลรูปภาพ**
  const toggleImage = (id: string) => {
      // ถ้า id ที่ส่งมาตรงกับ id ที่เปิดอยู่ ให้ปิด (null)
      // ถ้าไม่ตรง หรือยังไม่ได้เปิด ให้เปิด id นั้น
      setExpandedLogId(prevId => (prevId === id ? null : id));
  };


  return (
    <div className="dashboard-body">
      <div className="dashboard-container">
        <Sidebar activePath="/logs" />

        {/* Main Content for Logs */}
        <main className="main-content">
            <div style={{ padding: 30 }}>
                <h1>📁 Incident Logs (Click to view image)</h1>
                <p>Total camera logs found: **{logs.length}**</p>
            </div>

            <div className="logs-grid" style={{ padding: '0 30px 30px' }}>
                {loading ? (
                    <p>Loading incident logs...</p>
                ) : logs.length > 0 ? (
                    logs.map((log) => {
                        // ตรวจสอบว่า Log นี้มีรูปภาพหรือไม่ และควรแสดงรูปภาพหรือไม่
                        const isExpanded = expandedLogId === log.id;
                        const hasImage = log.imageUrl;

                        return (
                            // **FIX 3: ปรับ Log Card ให้แสดงแค่ Timestamp ในตอนแรก และเพิ่ม onClick**
                            <div 
                                key={log.id} 
                                className="log-card" 
                                style={{ 
                                    cursor: hasImage ? 'pointer' : 'default', // มีรูปภาพจึงคลิกได้
                                    padding: 15, 
                                    border: isExpanded ? '2px solid #007bff' : '1px solid #ccc' // เน้นรายการที่ถูกเปิด
                                }}
                                onClick={() => hasImage && toggleImage(log.id)}
                            >
                                <p style={{ margin: 0 }}>
                                    <b>{isExpanded ? '🔽 ' : '▶️ '} Timestamp:</b> {formatTimestamp(log.timestamp)}
                                </p>
                                

                                {/* **FIX 4: แสดงรูปภาพเฉพาะเมื่อ log นั้นถูกขยาย (Expanded)** */}
                                {isExpanded && hasImage && (
                                    <div style={{ marginTop: 15, borderTop: '1px solid #eee', paddingTop: 10 }}>
                                        <img
                                            src={log.imageUrl}
                                            alt={`Log Image from ${formatTimestamp(log.timestamp)}`}
                                            style={{
                                                width: "100%",
                                                maxWidth: "300px",
                                                maxHeight: "300px",
                                                objectFit: "cover",
                                                borderRadius: 10,
                                                display: 'block', // ให้เป็น block element
                                                margin: '0 auto', // จัดให้อยู่ตรงกลาง
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p>No incident logs found from the camera source ("MQTT_Trigger_Camera").</p>
                )}
            </div>
        </main>
      </div>
    </div>
  );
}