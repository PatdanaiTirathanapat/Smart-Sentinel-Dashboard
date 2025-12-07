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
                <p>Total camera logs found: {logs.length}</p>
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
                                <p style={{ margin: 0 }}>
                                    <b>{isExpanded ? '🔽 ' : '▶️ '} Timestamp:</b> {formatTimestamp(log.timestamp)}
                                </p>
                                
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
                    <p>No incident logs found.</p>
                )}
            </div>
        </main>
      </div>
    </div>
  );
}