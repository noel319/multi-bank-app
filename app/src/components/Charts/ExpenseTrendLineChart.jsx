// src/components/Charts/ExpenseTrendLineChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, Label } from 'recharts';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { CHART_COLORS } from '../../utils/constants';


const CustomTrendTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white p-2 shadow-lg rounded-md text-xs">
        <p>{`${payload[0].name}: ${payload[0].value}`}</p> {/* Assuming only one series for this tooltip style */}
        {/* If multiple series and you want to show both:
        {payload.map((pld, i) => (
          <div key={i} style={{color: pld.stroke}}>{`${pld.name}: ${pld.value}`}</div>
        ))}
        */}
      </div>
    );
  }
  return null;
};


const ExpenseTrendLineChart = ({
  trendData, // Array: { month: 'Oct', series1: 20, series2: (optional) 15 }
  series1Key = "series1",
  series2Key = "series2", // Optional second series
  series1Name = "Current Period",
  series2Name = "Previous Period",
  series1Color = CHART_COLORS[0],
  series2Color = CHART_COLORS[1],
  title = "Expense Trend",
  showCalendarIcon = true,
  className = "",
  referenceDotData, // Optional: { x: 'Dec', y: 77.6, label: '77.6' }
}) => {
  return (
    <div className={`bg-beige-50 p-4 md:p-6 rounded-xl shadow-lg ${className} bg-[#F5F3EF]`}> {/* Matching beige background */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-semibold text-slate-800">{title}</h3>
        {showCalendarIcon && <CalendarDaysIcon className="h-5 w-5 text-slate-500" />}
      </div>
      <div className="h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid horizontal={true} vertical={false} stroke="#E5E0D9" strokeDasharray="3 3" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} stroke="#78716c" dy={5} />
            <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#78716c" domain={['dataMin - 5', 'dataMax + 10']} />
            {/* The tooltip in the image seems custom or disabled, this is a basic one */}
            <Tooltip
              content={referenceDotData ? <CustomTrendTooltip /> : <Tooltip />}
              cursor={{ stroke: series1Color, strokeWidth: 1, strokeDasharray: '3 3' }}
              wrapperStyle={referenceDotData ? { outline: 'none' } : {}} // For custom tooltip with no default border
            />
            <Line
              type="monotone"
              dataKey={series1Key}
              name={series1Name}
              stroke={series1Color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: series1Color }}
            />
            {series2Key && trendData.some(d => d[series2Key] !== undefined) && (
              <Line
                type="monotone"
                dataKey={series2Key}
                name={series2Name}
                stroke={series2Color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: series2Color }}
              />
            )}
            {referenceDotData && (
              <ReferenceDot 
                x={referenceDotData.x} 
                y={referenceDotData.y} 
                r={5} 
                fill={series1Color} 
                stroke="white" 
                strokeWidth={2}
              >
                <Label 
                  value={referenceDotData.label} 
                  position="top" 
                  offset={-18} // Adjust offset to position label correctly
                  fill="white"
                  fontSize={10}
                  style={{
                    transform: 'translateY(-5px)', // Fine-tune position
                  }}
                  content={({ viewBox, value }) => ( // Custom label content for background
                    <foreignObject x={viewBox.x - 20} y={viewBox.y - 25} width="40" height="20">
                      <div xmlns="http://www.w3.org/1999/xhtml" 
                           className="bg-slate-800 text-white px-1.5 py-0.5 rounded text-xs text-center">
                        {value}
                      </div>
                    </foreignObject>
                  )}
                />
              </ReferenceDot>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpenseTrendLineChart;