"use client";

import { useMemo } from "react";
import {
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

interface Packet {
    id: string;
    timestamp: string;
    source: string;
    destination: string;
    protocol: string;
    length: number;
}

interface TrafficChartsProps {
    packets: Packet[];
}

const COLORS = {
    TCP: "#3b82f6", // Blue-500
    UDP: "#f59e0b", // Amber-500
    DNS: "#a855f7", // Purple-500
    OTHER: "#64748b", // Slate-500
};

export default function TrafficCharts({ packets }: TrafficChartsProps) {
    // 1. Calculate Protocol Distribution for Pie Chart
    const protocolData = useMemo(() => {
        const counts = { TCP: 0, UDP: 0, OTHER: 0 };
        packets.forEach((p) => {
            const proto = p.protocol === "TCP" || p.protocol === "UDP" ? p.protocol : "OTHER";
            counts[proto]++;
        });
        return [
            { name: "TCP", value: counts.TCP },
            { name: "UDP", value: counts.UDP },
            { name: "Other", value: counts.OTHER },
        ];
    }, [packets]);

    // 2. Calculate Traffic Volume (Packets over time) for Line Chart
    // We'll group packets by their timestamp (HH:MM:SS)
    const volumeData = useMemo(() => {
        // Take the last 20 timestamps to keep the chart moving
        const recentPackets = packets.slice(-50);
        const timeline: Record<string, number> = {};

        recentPackets.forEach((p) => {
            timeline[p.timestamp] = (timeline[p.timestamp] || 0) + p.length;
        });

        return Object.entries(timeline).map(([time, bytes]) => ({
            time,
            bytes,
        }));
    }, [packets]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-900 border-b border-slate-800 h-64">
            {/* Protocol Distribution */}
            <div className="bg-slate-950 rounded-lg p-2 border border-slate-800 flex flex-col relative">
                <h3 className="text-xs font-bold text-slate-400 absolute top-2 left-3 uppercase tracking-wider">Protocol Split</h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={protocolData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                <Cell key="cell-tcp" fill={COLORS.TCP} />
                                <Cell key="cell-udp" fill={COLORS.UDP} />
                                <Cell key="cell-other" fill={COLORS.OTHER} />
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                                itemStyle={{ color: '#e2e8f0' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Traffic Volume */}
            <div className="bg-slate-950 rounded-lg p-2 border border-slate-800 flex flex-col relative">
                <h3 className="text-xs font-bold text-slate-400 absolute top-2 left-3 uppercase tracking-wider">Traffic Volume (Bytes)</h3>
                <div className="flex-1 min-h-0 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={volumeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="time" hide={true} />
                            <YAxis stroke="#475569" fontSize={10} width={40} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                                itemStyle={{ color: '#10b981' }}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="bytes"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                                isAnimationActive={false} // Disable animation for smoother real-time updates
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
