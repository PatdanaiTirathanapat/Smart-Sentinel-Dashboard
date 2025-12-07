// src/app/logs/page.tsx

"use client";

import React, { useEffect, useState } from "react";
// เพิ่ม query, orderBy, limit เข้ามาใช้งาน
import { collection, getDocs, Timestamp, query, orderBy, limit } from "firebase/firestore";
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
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null); 

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const colRef = collection(firestoreDB, "logs");

        // 1. สร้าง Query ดึงข้อมูลล่าสุด 50 รายการ (เรียงตามเวลา)
        // เพื่อป้องกันการดึงข้อมูลทั้งหมดถ้า Database มีเยอะเกินไป
        const q = query(colRef, orderBy("timestamp", "desc"), limit(50));
        
        const snapshot = await getDocs(q);

        const allItems: LogItem[] = snapshot.docs
          .map((doc: any) => ({ 
              id: doc.id, 
              ...doc.data() 
          } as LogItem))
          // 2. จุดที่แก้: กรองเอาเฉพาะที่มีคำว่า "Camera" ใน field source
          .filter(log => log.source && log.source.toString().includes("Camera"));

        // ไม่ต้อง sort ซ้ำแล้วเพราะเรา orderBy จาก Firestore มาแล้ว
        setLogs(allItems);
      } catch (error) {
        console.error("Error loading logs:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  const toggleImage = (id: string) => {
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
              {/*  <p>Latest camera logs found: {logs.length}</p> */}
            </div>

            <div className="logs-grid" style={{ padding: '0 30px 30px' }}>
                {loading ? (
                    <p>Loading logs...</p>
                ) : logs.length > 0 ? (
                    logs.map((log) => {
                        const isExpanded = expandedLogId === log.id;
                        const hasImage = log.imageUrl;

                        return (
                            <div 
                                key={log.id} 
                                className="log-card" 
                                style={{ 
                                    cursor: hasImage ? 'pointer' : 'default', 
                                    padding: 15, 
                                    border: isExpanded ? '2px solid #007bff' : '1px solid #ccc' 
                                }}
                                onClick={() => hasImage && toggleImage(log.id)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <p style={{ margin: 0 }}>
                                        <b>{isExpanded ? '🔽 ' : '▶️ '} Timestamp:</b> {formatTimestamp(log.timestamp)}
                                    </p>
                                    <span style={{ fontSize: '0.8em', color: '#666', background: '#eee', padding: '2px 8px', borderRadius: 4 }}>
                                        {log.type}
                                    </span>
                                </div>
                                
                                {isExpanded && hasImage && (
                                    <div style={{ marginTop: 15, borderTop: '1px solid #eee', paddingTop: 10 }}>
                                        <img
                                            src={log.imageUrl}
                                            alt={`Log Image from ${formatTimestamp(log.timestamp)}`}
                                            style={{
                                                width: "100%",
                                                maxWidth: "300px",
                                                maxHeight: "300px",
                                                objectFit: "contain", // เปลี่ยนเป็น contain ให้เห็นภาพครบ
                                                borderRadius: 10,
                                                display: 'block', 
                                                margin: '0 auto', 
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p>No camera logs found in the last 50 entries.</p>
                )}
            </div>
        </main>
      </div>
    </div>
  );
}