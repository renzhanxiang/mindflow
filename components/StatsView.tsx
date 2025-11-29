import React from 'react';
import { Entry, EmotionType } from '../types';
import { EMOTION_CONFIG } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import * as d3 from 'd3';
import { useLanguage } from '../contexts/LanguageContext';

interface StatsViewProps {
  entries: Entry[];
}

const TagBubbleChart: React.FC<{ entries: Entry[] }> = ({ entries }) => {
  const { t } = useLanguage();
  const svgRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    if (!svgRef.current || entries.length === 0) return;

    const tagCounts: Record<string, number> = {};
    entries.forEach(e => {
      e.tags.forEach(t => {
        const cleanTag = t.toLowerCase();
        tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
      });
    });

    const data = Object.entries(tagCounts).map(([text, value]) => ({ text, value }));
    if(data.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = 200;
    
    d3.select(svgRef.current).selectAll("*").remove();

    const radiusScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.value) || 0, d3.max(data, d => d.value) || 0])
      .range([20, 45]);

    const simulation = d3.forceSimulation(data as any)
      .force("charge", d3.forceManyBody().strength(5))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => radiusScale(d.value) + 2));

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const nodes = svg.selectAll("g")
      .data(data)
      .enter()
      .append("g");

    nodes.append("circle")
      .attr("r", (d: any) => radiusScale(d.value))
      .attr("fill", (d: any, i) => d3.schemeTableau10[i % 10])
      .attr("opacity", 0.7);

    nodes.append("text")
      .text((d: any) => d.text)
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .style("fill", "white")
      .style("font-size", (d: any) => Math.min(12, radiusScale(d.value) / 2) + "px")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      nodes.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

  }, [entries]);

  return (
    <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('stats.clusters')}</h3>
      <svg ref={svgRef} className="w-full h-[200px]" />
    </div>
  );
};

const StatsView: React.FC<StatsViewProps> = ({ entries }) => {
  const { t } = useLanguage();

  const emotionCounts = entries.reduce((acc, entry) => {
    acc[entry.emotion] = (acc[entry.emotion] || 0) + 1;
    return acc;
  }, {} as Record<EmotionType, number>);

  const pieData = Object.entries(emotionCounts).map(([key, value]) => ({
    name: t(`emotion.${key}`), // Use translation key
    value: Number(value),
    color: EMOTION_CONFIG[key as EmotionType].color
  }));

  const topMood = pieData.length > 0 
    ? [...pieData].sort((a, b) => b.value - a.value)[0]
    : null;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const lineData = last7Days.map(dateStr => {
    const dayEntries = entries.filter(e => new Date(e.timestamp).toISOString().split('T')[0] === dateStr);
    return {
      date: new Date(dateStr).toLocaleDateString([], { weekday: 'short' }),
      count: dayEntries.length
    };
  });

  return (
    <div className="pb-24 px-4 pt-4 overflow-y-auto h-full no-scrollbar">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('stats.title')}</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-brand-500 to-brand-600 p-4 rounded-xl text-white shadow-lg">
          <p className="text-brand-100 text-sm">{t('stats.totalThoughts')}</p>
          <p className="text-3xl font-bold">{entries.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-gray-400 text-sm">{t('stats.topMood')}</p>
          {topMood ? (
            <p className="text-xl font-bold text-slate-700">
              {topMood.name}
            </p>
          ) : (
            <p className="text-lg text-slate-500">-</p>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('stats.spectrum')}</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {pieData.map(d => (
            <div key={d.name} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
              <span className="text-xs text-gray-500">{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('stats.activity')}</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <YAxis hide />
              <Tooltip 
                cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff'}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <TagBubbleChart entries={entries} />

    </div>
  );
};

export default StatsView;