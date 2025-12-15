import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function MonthlyLeadBarChart({ data }) {
  const labels = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const highest = Math.max(...data);
  let maxVal = Math.ceil(highest / 5) * 5;
  if (maxVal < 20) maxVal = 20;  // 🔥 For compact scale

  const chartData = {
    labels,
    datasets: [
      {
        label: "Monthly Leads",
        data,
        borderRadius: 12,

        // 🔥 COMPACT BAR SIZE
        barThickness: 28,
        maxBarThickness: 32,

        // Smooth gradient
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return null;

          const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.bottom);
          gradient.addColorStop(0, "#60A5FA");
          gradient.addColorStop(1, "#3B82F6");
          return gradient;
        },
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 12, weight: "600" },
          padding: 10,
        },
      },

      tooltip: {
        backgroundColor: "#fff",
        borderColor: "#ddd",
        borderWidth: 1,
        titleColor: "#111",
        bodyColor: "#333",
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      },
    },

    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11, weight: "600" },
          color: "#555",
        },
      },

      y: {
        beginAtZero: true,
        max: maxVal,
        ticks: {
          stepSize: 5,
          font: { size: 11, weight: "600" },
          color: "#555",
        },
        grid: {
          color: "rgba(0,0,0,0.05)",
          borderDash: [3, 3],
        },
      },
    },
  };

  return (
    <div style={{ height: "200px", width: "100%" }}>  {/* 🔥 compact height */}
      <Bar data={chartData} options={options} />
    </div>
  );
}
