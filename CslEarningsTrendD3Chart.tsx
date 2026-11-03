import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { BarChart3, Layers, TrendingUp, IndianRupee, Clock, Edit3, Check, RotateCcw, Sparkles } from 'lucide-react';
import { Language } from '../types';

export interface MonthlyEarningsRecord {
  id: string;
  monthShort: string;
  monthLabelEn: string;
  monthLabelMl: string;
  monthLabelHi: string;
  year: number;
  netFixedPay: number;
  netOt: number;
  otHours: number;
  isCurrentOrLatest?: boolean;
}

interface CslEarningsTrendD3ChartProps {
  language?: Language;
  isContract?: boolean;
  liveNetFixedPay?: number;
  liveNetOt?: number;
  liveOtHours?: number;
  selectedCycleMonth?: number;
}

const STORAGE_KEY_PERMANENT = 'csl_d3_salary_trend_6m_perm_v1';
const STORAGE_KEY_CONTRACT = 'csl_d3_salary_trend_6m_contract_v1';

const getDefaultSixMonthsData = (isContract: boolean): MonthlyEarningsRecord[] => {
  // Check if user has verified salary slip values stored in Money Management
  let savedOctBase = isContract ? 18400 : 38279;
  let savedOctOt = isContract ? 3200 : 6420;
  try {
    const rawBase = localStorage.getItem('csl_money_base_income_2026_10') || localStorage.getItem('csl_money_base_income');
    const rawOt = localStorage.getItem('csl_money_ot_income_2026_10') || localStorage.getItem('csl_money_ot_income');
    if (rawBase && Number(rawBase) > 0) savedOctBase = Math.round(Number(rawBase));
    if (rawOt && Number(rawOt) >= 0) savedOctOt = Math.round(Number(rawOt));
  } catch {}

  if (isContract) {
    return [
      {
        id: '2026-06',
        monthShort: 'Jun',
        monthLabelEn: 'Jun 2026',
        monthLabelMl: 'ജൂൺ 2026',
        monthLabelHi: 'जून 2026',
        year: 2026,
        netFixedPay: 18150,
        netOt: 2450,
        otHours: 14,
      },
      {
        id: '2026-07',
        monthShort: 'Jul',
        monthLabelEn: 'Jul 2026',
        monthLabelMl: 'ജൂലൈ 2026',
        monthLabelHi: 'जुलाई 2026',
        year: 2026,
        netFixedPay: 18150,
        netOt: 3150,
        otHours: 18,
      },
      {
        id: '2026-08',
        monthShort: 'Aug',
        monthLabelEn: 'Aug 2026',
        monthLabelMl: 'ഓഗസ്റ്റ് 2026',
        monthLabelHi: 'अगस्त 2026',
        year: 2026,
        netFixedPay: 18400,
        netOt: 2800,
        otHours: 16,
      },
      {
        id: '2026-09',
        monthShort: 'Sep',
        monthLabelEn: 'Sep 2026',
        monthLabelMl: 'സെപ്റ്റംബർ 2026',
        monthLabelHi: 'सितंबर 2026',
        year: 2026,
        netFixedPay: 18400,
        netOt: 3850,
        otHours: 22,
      },
      {
        id: '2026-10',
        monthShort: 'Oct',
        monthLabelEn: 'Oct 2026',
        monthLabelMl: 'ഒക്ടോബർ 2026',
        monthLabelHi: 'अक्टूबर 2026',
        year: 2026,
        netFixedPay: savedOctBase,
        netOt: savedOctOt,
        otHours: 16,
      },
      {
        id: '2026-11',
        monthShort: 'Nov',
        monthLabelEn: 'Nov 2026',
        monthLabelMl: 'നവംബർ 2026',
        monthLabelHi: 'नवंबर 2026',
        year: 2026,
        netFixedPay: savedOctBase,
        netOt: 3500,
        otHours: 20,
        isCurrentOrLatest: true,
      },
    ];
  }

  return [
    {
      id: '2026-06',
      monthShort: 'Jun',
      monthLabelEn: 'Jun 2026',
      monthLabelMl: 'ജൂൺ 2026',
      monthLabelHi: 'जून 2026',
      year: 2026,
      netFixedPay: 37650,
      netOt: 4815,
      otHours: 12,
    },
    {
      id: '2026-07',
      monthShort: 'Jul',
      monthLabelEn: 'Jul 2026',
      monthLabelMl: 'ജൂലൈ 2026',
      monthLabelHi: 'जुलाई 2026',
      year: 2026,
      netFixedPay: 37650,
      netOt: 6019,
      otHours: 15,
    },
    {
      id: '2026-08',
      monthShort: 'Aug',
      monthLabelEn: 'Aug 2026',
      monthLabelMl: 'ഓഗസ്റ്റ് 2026',
      monthLabelHi: 'अगस्त 2026',
      year: 2026,
      netFixedPay: 37980,
      netOt: 5618,
      otHours: 14,
    },
    {
      id: '2026-09',
      monthShort: 'Sep',
      monthLabelEn: 'Sep 2026',
      monthLabelMl: 'സെപ്റ്റംബർ 2026',
      monthLabelHi: 'सितंबर 2026',
      year: 2026,
      netFixedPay: 38279,
      netOt: 7222,
      otHours: 18,
    },
    {
      id: '2026-10',
      monthShort: 'Oct',
      monthLabelEn: 'Oct 2026',
      monthLabelMl: 'ഒക്ടോബർ 2026',
      monthLabelHi: 'अक्टूबर 2026',
      year: 2026,
      netFixedPay: savedOctBase,
      netOt: savedOctOt,
      otHours: 16,
    },
    {
      id: '2026-11',
      monthShort: 'Nov',
      monthLabelEn: 'Nov 2026',
      monthLabelMl: 'നവംബർ 2026',
      monthLabelHi: 'नवंबर 2026',
      year: 2026,
      netFixedPay: savedOctBase,
      netOt: savedOctOt,
      otHours: 16,
      isCurrentOrLatest: true,
    },
  ];
};

export const CslEarningsTrendD3Chart: React.FC<CslEarningsTrendD3ChartProps> = ({
  language = 'en',
  isContract = false,
  liveNetFixedPay,
  liveNetOt,
  liveOtHours,
}) => {
  const isMl = language === 'ml';
  const isHi = language === 'hi';

  const tr = (en: string, ml: string, hi: string) => {
    if (isMl) return ml;
    if (isHi) return hi;
    return en;
  };

  const storageKey = isContract ? STORAGE_KEY_CONTRACT : STORAGE_KEY_PERMANENT;

  const [records, setRecords] = useState<MonthlyEarningsRecord[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 6) {
          return parsed;
        }
      }
    } catch {}
    return getDefaultSixMonthsData(isContract);
  });

  // Reload if contract mode switches
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 6) {
          setRecords(parsed);
          return;
        }
      }
    } catch {}
    setRecords(getDefaultSixMonthsData(isContract));
  }, [isContract, storageKey]);

  const [chartMode, setChartMode] = useState<'stacked' | 'grouped'>('stacked');
  const [selectedMonthId, setSelectedMonthId] = useState<string>('2026-11');
  const [isEditingMonth, setIsEditingMonth] = useState<boolean>(false);
  const [editFixedInput, setEditFixedInput] = useState<string>('');
  const [editOtInput, setEditOtInput] = useState<string>('');

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(640);

  // Merge live calculator inputs into the latest month (Nov 2026) if user has typed Basic Salary or OT Hours
  const effectiveRecords = useMemo(() => {
    return records.map((rec, idx) => {
      if (idx === records.length - 1) {
        const hasLiveFixed = typeof liveNetFixedPay === 'number' && liveNetFixedPay > 0;
        const hasLiveOt = typeof liveNetOt === 'number' && liveNetOt > 0;
        const hasLiveHours = typeof liveOtHours === 'number' && liveOtHours > 0;
        return {
          ...rec,
          netFixedPay: hasLiveFixed ? Math.round(liveNetFixedPay!) : rec.netFixedPay,
          netOt: hasLiveOt ? Math.round(liveNetOt!) : rec.netOt,
          otHours: hasLiveHours ? liveOtHours! : rec.otHours,
        };
      }
      return rec;
    });
  }, [records, liveNetFixedPay, liveNetOt, liveOtHours]);

  const activeRecord = useMemo(() => {
    return (
      effectiveRecords.find((r) => r.id === selectedMonthId) ||
      effectiveRecords[effectiveRecords.length - 1]
    );
  }, [effectiveRecords, selectedMonthId]);

  // Observe container width for responsive D3 SVG rendering
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.getBoundingClientRect().width;
        if (w > 240) setContainerWidth(w);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Format currency helper
  const fmtINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(val));

  // D3 combined bar chart rendering (Stacked & Grouped modes)
  useEffect(() => {
    if (!svgRef.current || effectiveRecords.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = Math.max(300, containerWidth);
    const height = 290;
    const margin = { top: 34, right: 16, bottom: 44, left: 54 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    // SVG Gradients for Net Fixed Pay (Emerald/Teal) and Net OT (Amber/Orange)
    const defs = svg.append('defs');

    const fixedGrad = defs
      .append('linearGradient')
      .attr('id', 'cslFixedPayGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    fixedGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    fixedGrad.append('stop').attr('offset', '100%').attr('stop-color', '#059669');

    const otGrad = defs
      .append('linearGradient')
      .attr('id', 'cslNetOtGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    otGrad.append('stop').attr('offset', '0%').attr('stop-color', '#fbbf24');
    otGrad.append('stop').attr('offset', '100%').attr('stop-color', '#d97706');

    const chartGroup = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const months = effectiveRecords.map((d) => d.monthShort);

    const x0 = d3
      .scaleBand<string>()
      .domain(months)
      .range([0, innerWidth])
      .paddingInner(0.28)
      .paddingOuter(0.14);

    const maxTotal =
      d3.max(effectiveRecords, (d) =>
        chartMode === 'stacked'
          ? d.netFixedPay + d.netOt
          : Math.max(d.netFixedPay, d.netOt)
      ) || 50000;

    const y = d3
      .scaleLinear()
      .domain([0, maxTotal * 1.16])
      .nice()
      .range([innerHeight, 0]);

    // Horizontal Y grid lines
    const yTicks = y.ticks(5);
    chartGroup
      .selectAll('.grid-line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', '#133b54')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', 1);

    // Y-axis labels (in ₹k format)
    const yAxis = d3
      .axisLeft(y)
      .ticks(5)
      .tickSize(0)
      .tickFormat((d) => {
        const num = Number(d);
        if (num === 0) return '₹0';
        return `₹${(num / 1000).toFixed(0)}k`;
      });

    const yAxisGroup = chartGroup.append('g').call(yAxis);
    yAxisGroup.select('.domain').remove();
    yAxisGroup
      .selectAll('text')
      .attr('fill', '#7dd3fc')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .attr('font-weight', '700')
      .attr('dx', '-6px');

    // X-axis
    const xAxis = d3.axisBottom(x0).tickSize(0);
    const xAxisGroup = chartGroup
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#1e4963').attr('stroke-width', 1.5);
    xAxisGroup
      .selectAll('text')
      .attr('fill', (d) => {
        const rec = effectiveRecords.find((r) => r.monthShort === d);
        return rec?.id === selectedMonthId ? '#38bdf8' : '#cbd5e1';
      })
      .attr('font-size', '11px')
      .attr('font-weight', '800')
      .attr('dy', '14px');

    // Sub-label for year under month
    chartGroup
      .selectAll('.year-sublabel')
      .data(effectiveRecords)
      .enter()
      .append('text')
      .attr('x', (d) => (x0(d.monthShort) || 0) + x0.bandwidth() / 2)
      .attr('y', innerHeight + 29)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (d.id === selectedMonthId ? '#38bdf8' : '#64748b'))
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .text((d) => (d.isCurrentOrLatest ? '2026 • LIVE' : '2026'));

    // Highlight backdrop behind selected month column
    chartGroup
      .selectAll('.active-col-bg')
      .data(effectiveRecords)
      .enter()
      .append('rect')
      .attr('x', (d) => (x0(d.monthShort) || 0) - 6)
      .attr('y', -18)
      .attr('width', x0.bandwidth() + 12)
      .attr('height', innerHeight + 18)
      .attr('rx', 10)
      .attr('fill', (d) => (d.id === selectedMonthId ? 'rgba(56, 189, 248, 0.08)' : 'transparent'))
      .attr('stroke', (d) => (d.id === selectedMonthId ? 'rgba(56, 189, 248, 0.35)' : 'transparent'))
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setSelectedMonthId(d.id);
        setIsEditingMonth(false);
      });

    if (chartMode === 'stacked') {
      // Combined Stacked Bar View (Net Fixed Pay at base + Net OT stacked on top)
      const groups = chartGroup
        .selectAll('.month-stack-group')
        .data(effectiveRecords)
        .enter()
        .append('g')
        .attr('class', 'month-stack-group')
        .style('cursor', 'pointer')
        .on('click', (_event, d) => {
          setSelectedMonthId(d.id);
          setIsEditingMonth(false);
        });

      // 1. Net Fixed Pay bar (bottom segment)
      groups
        .append('rect')
        .attr('x', (d) => x0(d.monthShort) || 0)
        .attr('y', innerHeight)
        .attr('width', x0.bandwidth())
        .attr('height', 0)
        .attr('rx', 5)
        .attr('fill', 'url(#cslFixedPayGrad)')
        .attr('stroke', (d) => (d.id === selectedMonthId ? '#6ee7b7' : 'none'))
        .attr('stroke-width', 1.2)
        .transition()
        .duration(550)
        .ease(d3.easeCubicOut)
        .attr('y', (d) => y(d.netFixedPay))
        .attr('height', (d) => Math.max(0, innerHeight - y(d.netFixedPay)));

      // 2. Net OT bar (top stacked segment)
      groups
        .append('rect')
        .attr('x', (d) => x0(d.monthShort) || 0)
        .attr('y', innerHeight)
        .attr('width', x0.bandwidth())
        .attr('height', 0)
        .attr('rx', 5)
        .attr('fill', 'url(#cslNetOtGrad)')
        .attr('stroke', (d) => (d.id === selectedMonthId ? '#fde68a' : 'none'))
        .attr('stroke-width', 1.2)
        .transition()
        .duration(650)
        .ease(d3.easeCubicOut)
        .attr('y', (d) => y(d.netFixedPay + d.netOt))
        .attr('height', (d) => Math.max(0, y(d.netFixedPay) - y(d.netFixedPay + d.netOt) - 1.5));

      // Total Take-Home value label above stacked bar
      groups
        .append('text')
        .attr('x', (d) => (x0(d.monthShort) || 0) + x0.bandwidth() / 2)
        .attr('y', (d) => y(d.netFixedPay + d.netOt) - 7)
        .attr('text-anchor', 'middle')
        .attr('fill', (d) => (d.id === selectedMonthId ? '#fef08a' : '#e2e8f0'))
        .attr('font-size', width < 420 ? '9px' : '10px')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
        .attr('font-weight', '800')
        .text((d) => `₹${((d.netFixedPay + d.netOt) / 1000).toFixed(1)}k`);
    } else {
      // Side-by-Side Combined Grouped Bar View (Net Fixed Pay bar + Net OT bar)
      const x1 = d3
        .scaleBand<string>()
        .domain(['netFixedPay', 'netOt'])
        .range([0, x0.bandwidth()])
        .padding(0.12);

      const groups = chartGroup
        .selectAll('.month-grouped-bars')
        .data(effectiveRecords)
        .enter()
        .append('g')
        .attr('class', 'month-grouped-bars')
        .attr('transform', (d) => `translate(${x0(d.monthShort) || 0},0)`)
        .style('cursor', 'pointer')
        .on('click', (_event, d) => {
          setSelectedMonthId(d.id);
          setIsEditingMonth(false);
        });

      // Bar 1: Net Fixed Pay
      groups
        .append('rect')
        .attr('x', x1('netFixedPay') || 0)
        .attr('y', innerHeight)
        .attr('width', x1.bandwidth())
        .attr('height', 0)
        .attr('rx', 4)
        .attr('fill', 'url(#cslFixedPayGrad)')
        .transition()
        .duration(550)
        .ease(d3.easeCubicOut)
        .attr('y', (d) => y(d.netFixedPay))
        .attr('height', (d) => Math.max(0, innerHeight - y(d.netFixedPay)));

      // Bar 2: Net OT
      groups
        .append('rect')
        .attr('x', x1('netOt') || 0)
        .attr('y', innerHeight)
        .attr('width', x1.bandwidth())
        .attr('height', 0)
        .attr('rx', 4)
        .attr('fill', 'url(#cslNetOtGrad)')
        .transition()
        .duration(650)
        .ease(d3.easeCubicOut)
        .attr('y', (d) => y(d.netOt))
        .attr('height', (d) => Math.max(0, innerHeight - y(d.netOt)));

      // Value labels above each grouped bar
      groups
        .append('text')
        .attr('x', (x1('netFixedPay') || 0) + x1.bandwidth() / 2)
        .attr('y', (d) => y(d.netFixedPay) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6ee7b7')
        .attr('font-size', '8.5px')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
        .attr('font-weight', '800')
        .text((d) => `${(d.netFixedPay / 1000).toFixed(1)}k`);

      groups
        .append('text')
        .attr('x', (x1('netOt') || 0) + x1.bandwidth() / 2)
        .attr('y', (d) => y(d.netOt) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fcd34d')
        .attr('font-size', '8.5px')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
        .attr('font-weight', '800')
        .text((d) => `${(d.netOt / 1000).toFixed(1)}k`);
    }

    // Trend line connecting Total Take-Home across the 6 months
    const lineGenerator = d3
      .line<MonthlyEarningsRecord>()
      .x((d) => (x0(d.monthShort) || 0) + x0.bandwidth() / 2)
      .y((d) =>
        chartMode === 'stacked'
          ? y(d.netFixedPay + d.netOt)
          : y(Math.max(d.netFixedPay, d.netOt))
      )
      .curve(d3.curveMonotoneX);

    chartGroup
      .append('path')
      .datum(effectiveRecords)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.75)
      .attr('stroke-dasharray', '4,3')
      .attr('opacity', 0.75)
      .attr('d', lineGenerator);

    chartGroup
      .selectAll('.trend-dot')
      .data(effectiveRecords)
      .enter()
      .append('circle')
      .attr('cx', (d) => (x0(d.monthShort) || 0) + x0.bandwidth() / 2)
      .attr('cy', (d) =>
        chartMode === 'stacked'
          ? y(d.netFixedPay + d.netOt)
          : y(Math.max(d.netFixedPay, d.netOt))
      )
      .attr('r', (d) => (d.id === selectedMonthId ? 4.5 : 3))
      .attr('fill', (d) => (d.id === selectedMonthId ? '#38bdf8' : '#0284c7'))
      .attr('stroke', '#04121b')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setSelectedMonthId(d.id);
        setIsEditingMonth(false);
      });
  }, [effectiveRecords, chartMode, containerWidth, selectedMonthId]);

  // 6-Month Aggregates
  const summaryStats = useMemo(() => {
    const totalFixed = effectiveRecords.reduce((acc, r) => acc + r.netFixedPay, 0);
    const totalOt = effectiveRecords.reduce((acc, r) => acc + r.netOt, 0);
    const avgFixed = Math.round(totalFixed / effectiveRecords.length);
    const avgOt = Math.round(totalOt / effectiveRecords.length);
    const highestMonth = [...effectiveRecords].sort(
      (a, b) => b.netFixedPay + b.netOt - (a.netFixedPay + a.netOt)
    )[0];
    return { totalFixed, totalOt, avgFixed, avgOt, highestMonth };
  }, [effectiveRecords]);

  const handleStartEdit = () => {
    if (!activeRecord) return;
    setEditFixedInput(String(activeRecord.netFixedPay));
    setEditOtInput(String(activeRecord.netOt));
    setIsEditingMonth(true);
  };

  const handleSaveMonthEdit = () => {
    const parsedFixed = Math.max(0, Math.round(Number(editFixedInput) || 0));
    const parsedOt = Math.max(0, Math.round(Number(editOtInput) || 0));
    const updated = records.map((r) =>
      r.id === activeRecord.id
        ? { ...r, netFixedPay: parsedFixed, netOt: parsedOt }
        : r
    );
    setRecords(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
    setIsEditingMonth(false);
  };

  const handleResetDefaultTrend = () => {
    const defaults = getDefaultSixMonthsData(isContract);
    setRecords(defaults);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setIsEditingMonth(false);
  };

  return (
    <div className="rounded-3xl bg-[#061825]/95 text-white p-5 sm:p-6 shadow-2xl border border-[#0f354c] relative overflow-hidden backdrop-blur-md">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0f354c] pb-3.5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                {tr(
                  '6-Month Earnings Trend (Net Fixed Pay & Net OT)',
                  '6 മാസത്തെ ശമ്പള-ഓവർടൈം ട്രെൻഡ് (Net Fixed Pay & Net OT)',
                  '6-महीने का वेतन और ओटी रुझान (Net Fixed Pay & Net OT)'
                )}
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30">
                D3 Analytics
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {tr(
                'Interactive D3 combined bar chart comparing monthly Net Fixed Pay and Net OT (Jun – Nov 2026)',
                'ജൂൺ മുതൽ നവംബർ 2026 വരെയുള്ള പ്രതിമാസ Net Fixed Pay, Net OT എന്നിവയുടെ താരതമ്യം',
                'जून से नवंबर 2026 तक मासिक नेट फिक्स्ड वेतन और नेट ओटी की तुलना'
              )}
            </p>
          </div>
        </div>

        {/* Mode Toggle: Stacked vs Side-by-Side Grouped */}
        <div className="flex items-center gap-1.5 bg-[#04121b] p-1 rounded-xl border border-[#123d58]">
          <button
            type="button"
            onClick={() => setChartMode('stacked')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              chartMode === 'stacked'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{tr('Stacked Total', 'ഒരുമിച്ച് (Stacked)', 'स्टैक्ड')}</span>
          </button>
          <button
            type="button"
            onClick={() => setChartMode('grouped')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              chartMode === 'grouped'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{tr('Side-by-Side', 'വേർതിരിച്ച് (Grouped)', 'ग्रुप्ड')}</span>
          </button>
        </div>
      </div>

      {/* Legend & Live Sync Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-b from-emerald-400 to-emerald-600 inline-block shadow-sm" />
            <span className="text-xs font-bold text-emerald-300">
              {tr('Net Fixed Pay (Base Salary)', 'Net Fixed Pay (സ്ഥിര ശമ്പളം)', 'नेट फिक्स्ड वेतन')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-b from-amber-400 to-amber-600 inline-block shadow-sm" />
            <span className="text-xs font-bold text-amber-300">
              {tr('Net OT (Overtime Pay)', 'Net OT (ഓവർടൈം തുക)', 'नेट ओटी (ओवरटाइम)')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-sky-400 inline-block border-t border-dashed border-sky-300" />
            <span className="text-[11px] font-semibold text-sky-300">
              {tr('Take-Home Trend', 'മൊത്തം വരുമാന രേഖ', 'कुल आय रुझान')}
            </span>
          </div>
        </div>

        {(liveNetFixedPay && liveNetFixedPay > 0) || (liveNetOt && liveNetOt > 0) ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>
              {tr(
                'Nov 2026 bar synced with calculator inputs',
                'നവംബർ 2026 കാൽക്കുലേറ്ററുമായി സിങ്ക് ചെയ്യുന്നു',
                'नवंबर 2026 कैलकुलेटर से सिंक है'
              )}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleResetDefaultTrend}
            title={tr('Reset 6-Month Data', 'പഴയപടിയാക്കുക', 'रीसेट करें')}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{tr('Sync Slip Defaults', 'സ്ലിപ്പ് ഡാറ്റ സിങ്ക്', 'स्लिप डेटा सिंक')}</span>
          </button>
        )}
      </div>

      {/* D3 SVG Canvas Container */}
      <div
        ref={containerRef}
        className="w-full rounded-2xl bg-[#04121b] border border-[#123d58] p-2 sm:p-3 mb-4 select-none"
      >
        <svg ref={svgRef} className="w-full overflow-visible" />
      </div>

      {/* Selected Month Interactive Inspector & Quick Edit Bar */}
      {activeRecord && (
        <div className="rounded-2xl bg-[#071f30] border border-sky-500/30 p-3.5 sm:p-4 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-400/40 text-xs font-black text-sky-300">
                {isMl
                  ? activeRecord.monthLabelMl
                  : isHi
                  ? activeRecord.monthLabelHi
                  : activeRecord.monthLabelEn}
              </span>
              <span className="text-xs font-bold text-slate-300">
                {tr(
                  'Selected Month Breakdown (Tap any bar above to inspect)',
                  'തിരഞ്ഞെടുത്ത മാസത്തെ വിവരങ്ങൾ (മുകളിലെ ബാറിൽ തൊട്ട് മാറ്റാം)',
                  'चयनित महीने का विवरण (ऊपर किसी भी बार पर टैप करें)'
                )}
              </span>
            </div>

            {!isEditingMonth ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-[11px] font-bold transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3 text-sky-400" />
                <span>{tr('Edit Month Figures', 'തുക തിരുത്തുക', 'राशि संपादित करें')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveMonthEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{tr('Save Month', 'സേവ് ചെയ്യുക', 'सेव करें')}</span>
              </button>
            )}
          </div>

          {isEditingMonth ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#04121b] p-3 rounded-xl border border-emerald-500/40">
                <label className="text-[11px] font-bold text-emerald-300 uppercase block mb-1">
                  {tr('Net Fixed Pay (₹)', 'Net Fixed Pay (₹)', 'नेट फिक्स्ड वेतन (₹)')}
                </label>
                <input
                  type="number"
                  value={editFixedInput}
                  onChange={(e) => setEditFixedInput(e.target.value)}
                  className="w-full bg-[#071f30] text-white font-mono font-bold text-base px-3 py-1.5 rounded-lg border border-emerald-500/40 focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div className="bg-[#04121b] p-3 rounded-xl border border-amber-500/40">
                <label className="text-[11px] font-bold text-amber-300 uppercase block mb-1">
                  {tr('Net OT Amount (₹)', 'Net OT തുക (₹)', 'नेट ओटी राशि (₹)')}
                </label>
                <input
                  type="number"
                  value={editOtInput}
                  onChange={(e) => setEditOtInput(e.target.value)}
                  className="w-full bg-[#071f30] text-white font-mono font-bold text-base px-3 py-1.5 rounded-lg border border-amber-500/40 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="bg-[#04121b] p-3 rounded-xl border border-emerald-500/25">
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">
                  Net Fixed Pay
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-white mt-0.5 block">
                  ₹{fmtINR(activeRecord.netFixedPay)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {Math.round(
                    (activeRecord.netFixedPay /
                      Math.max(1, activeRecord.netFixedPay + activeRecord.netOt)) *
                      100
                  )}
                  % {tr('of total', 'ശമ്പള വിഹിതം', 'कुल का')}
                </span>
              </div>

              <div className="bg-[#04121b] p-3 rounded-xl border border-amber-500/25">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">
                  Net OT
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-amber-300 mt-0.5 block">
                  ₹{fmtINR(activeRecord.netOt)}
                </span>
                <span className="text-[10px] text-amber-400/80 font-medium inline-flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {activeRecord.otHours}h OT
                </span>
              </div>

              <div className="bg-[#04121b] p-3 rounded-xl border border-sky-500/30">
                <span className="text-[10px] font-extrabold text-sky-300 uppercase tracking-wider block">
                  {tr('Total Take-Home', 'ആകെ കൈയിൽ കിട്ടുന്നത്', 'कुल टेक-होम')}
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-sky-200 mt-0.5 block">
                  ₹{fmtINR(activeRecord.netFixedPay + activeRecord.netOt)}
                </span>
                <span className="text-[10px] text-sky-400/80 font-medium">
                  Fixed + Net OT
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6-Month Summary KPI Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <div className="flex items-center justify-between bg-[#04121b]/90 px-3.5 py-2.5 rounded-xl border border-[#123d58]">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              {tr('6-Mo Avg Net Fixed Pay', '6 മാസ ശരാശരി Net Fixed Pay', '6-माह औसत फिक्स्ड वेतन')}
            </span>
            <span className="text-sm font-black font-mono text-emerald-400">
              ₹{fmtINR(summaryStats.avgFixed)}/mo
            </span>
          </div>
          <IndianRupee className="w-4 h-4 text-emerald-500/60" />
        </div>

        <div className="flex items-center justify-between bg-[#04121b]/90 px-3.5 py-2.5 rounded-xl border border-[#123d58]">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              {tr('6-Mo Total Net OT Earned', '6 മാസത്തെ ആകെ Net OT', '6-माह कुल नेट ओटी')}
            </span>
            <span className="text-sm font-black font-mono text-amber-400">
              ₹{fmtINR(summaryStats.totalOt)}
            </span>
          </div>
          <TrendingUp className="w-4 h-4 text-amber-500/60" />
        </div>

        <div className="flex items-center justify-between bg-[#04121b]/90 px-3.5 py-2.5 rounded-xl border border-[#123d58]">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              {tr('Highest Take-Home Month', 'ഏറ്റവും ഉയർന്ന വരുമാന മാസം', 'उच्चतम आय वाला महीना')}
            </span>
            <span className="text-sm font-black font-mono text-sky-300">
              {summaryStats.highestMonth.monthShort} (₹
              {fmtINR(
                summaryStats.highestMonth.netFixedPay + summaryStats.highestMonth.netOt
              )}
              )
            </span>
          </div>
          <BarChart3 className="w-4 h-4 text-sky-400/60" />
        </div>
      </div>
    </div>
  );
};
