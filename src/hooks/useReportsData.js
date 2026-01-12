/**
 * useReportsData Hook
 * Custom hook for managing comprehensive report data with filters and AI insights
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    getComprehensiveReport,
    generateAISummary,
    getWasteInsights
} from "../utils/api/reports.js";

/**
 * Hook for fetching and managing comprehensive report data
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Report data, loading states, and control functions
 */
export function useReportsData(initialFilters = { period: "month" }) {
    const [filters, setFilters] = useState(initialFilters);
    const [reportData, setReportData] = useState(null);
    const [aiSummary, setAiSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch comprehensive report
    const fetchReport = useCallback(async (currentFilters) => {
        try {
            setLoading(true);
            setError(null);
            console.log("[useReportsData] Fetching report with filters:", currentFilters);

            const data = await getComprehensiveReport(currentFilters);
            console.log("[useReportsData] Received data:", data);
            setReportData(data);

            return data;
        } catch (err) {
            console.error("[useReportsData] Error fetching report:", err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch AI summary
    const fetchAISummary = useCallback(async (data, language = "ar") => {
        if (!data || !data.kpis || !data.top_causes) {
            console.warn("[useReportsData] Cannot generate AI summary - missing data");
            return null;
        }

        try {
            setAiLoading(true);

            const payload = {
                kpis: data.kpis,
                top_causes: data.top_causes,
                period: data.period || filters.period,
                comparisons: data.comparisons || {},
                data_completeness: data.data_completeness || 0.8,
                sample_size: data.sample_size || 50
            };

            console.log("[useReportsData] Generating AI summary with:", payload);
            const summary = await generateAISummary(payload, language);
            console.log("[useReportsData] AI summary:", summary);
            setAiSummary(summary);

            return summary;
        } catch (err) {
            console.error("[useReportsData] Error generating AI summary:", err);
            // Set a graceful fallback
            setAiSummary({
                ai_enabled: false,
                message: language === "ar"
                    ? "التحليل الذكي غير متاح حالياً"
                    : "AI analysis not available",
                error: err.message
            });
            return null;
        } finally {
            setAiLoading(false);
        }
    }, [filters.period]);

    // Load report on mount and filter change
    useEffect(() => {
        fetchReport(filters);
    }, [filters, fetchReport]);

    // Update filters
    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    // Manual reload
    const reload = useCallback(() => {
        return fetchReport(filters);
    }, [fetchReport, filters]);

    // Generate AI summary based on current data
    const loadAISummary = useCallback((language = "ar") => {
        if (reportData) {
            return fetchAISummary(reportData, language);
        }
        return Promise.resolve(null);
    }, [reportData, fetchAISummary]);

    // Computed insights from report data
    const insights = useMemo(() => {
        if (!reportData) return null;

        const { comparisons, top_causes, top_products, top_facilities, kpis } = reportData;

        return {
            // Highest waste cause
            highestCause: top_causes?.[0] || null,

            // Most wasted product
            mostWastedProduct: top_products?.[0] || null,

            // Riskiest facility
            riskiestFacility: top_facilities?.[0] || null,

            // Trend indicators
            wasteTrend: {
                direction: comparisons?.waste_direction || "stable",
                change: comparisons?.waste_change || 0,
                isImproving: comparisons?.waste_direction === "down"
            },

            incidentsTrend: {
                direction: comparisons?.incidents_direction || "stable",
                change: comparisons?.incidents_change || 0,
                isImproving: comparisons?.incidents_direction === "down"
            },

            returnsTrend: {
                direction: comparisons?.returns_direction || "stable",
                change: comparisons?.returns_change || 0,
                isImproving: comparisons?.returns_direction === "down"
            },

            // Risk levels
            riskSummary: {
                highRisk: reportData.risk_distribution?.high || 0,
                mediumRisk: reportData.risk_distribution?.medium || 0,
                lowRisk: reportData.risk_distribution?.low || 0,
                avgTransportRisk: kpis?.transport_risk || 0,
                avgCoolingRisk: kpis?.cooling_risk || 0
            }
        };
    }, [reportData]);

    return {
        // Data
        data: reportData,
        insights,
        aiSummary,

        // Loading states
        loading,
        aiLoading,

        // Error
        error,

        // Filters
        filters,
        updateFilters,

        // Actions
        reload,
        loadAISummary
    };
}

export default useReportsData;
