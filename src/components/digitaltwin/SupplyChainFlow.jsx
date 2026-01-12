import { useMemo } from "react";
import { Sankey, Tooltip, ResponsiveContainer, Layer, Rectangle } from "recharts";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

function SupplyChainFlow({ data: propData }) {
    const { theme } = useTheme();
    const { language } = useLanguage();

    const defaultData = {
        nodes: [
            { name: language === "ar" ? "المصانع" : "Factories" },
            { name: language === "ar" ? "المخازن الرئيسية" : "Main Warehouses" },
            { name: language === "ar" ? "مخازن التوزيع" : "Distribution Hubs" },
            { name: language === "ar" ? "الفروع" : "Branches" },
            { name: language === "ar" ? "العملاء" : "Customers" },
            { name: language === "ar" ? "الهدر" : "Waste" }
        ],
        links: [
            { source: 0, target: 1, value: 50 },
            { source: 1, target: 2, value: 30 },
            { source: 1, target: 3, value: 15 },
            { source: 2, target: 3, value: 25 },
            { source: 3, target: 4, value: 35 },
            { source: 1, target: 5, value: 2 },
            { source: 3, target: 5, value: 3 },
            { source: 2, target: 5, value: 1 },
        ],
    };

    // Map generic backend names to localized display names
    const nodeNameMap = {
        "Factories": language === "ar" ? "المصانع" : "Factories",
        "Main Warehouses": language === "ar" ? "المخازن الرئيسية" : "Main Warehouses",
        "Distribution Hubs": language === "ar" ? "مخازن التوزيع" : "Distribution Hubs",
        "Branches": language === "ar" ? "الفروع" : "Branches",
        "Customers": language === "ar" ? "العملاء" : "Customers",
        "Waste": language === "ar" ? "الهدر" : "Waste"
    };

    // Process data to translate names
    const processedData = useMemo(() => {
        const rawData = propData || defaultData;

        let nodes = rawData.nodes;
        // If we have data from backend, or using default data, translate the names
        nodes = rawData.nodes.map(node => ({
            ...node,
            name: nodeNameMap[node.name] || node.name
        }));

        return {
            ...rawData,
            nodes
        };
    }, [propData, defaultData, language]);

    const MyCustomNode = ({ x, y, width, height, index, payload, containerWidth }) => {
        const isOutOrIn = payload.name === (language === "ar" ? "الهدر" : "Waste");
        return (
            <Layer key={`CustomNode${index}`}>
                <Rectangle
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={isOutOrIn ? "#EF4444" : theme === "dark" ? "#429EBD" : "#053F5C"}
                    fillOpacity="1"
                />
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 5}
                    textAnchor="middle"
                    fill={theme === "dark" ? "#fff" : "#fff"}
                    fontSize="14"
                    fontWeight="bold"
                >
                    {payload.name}
                </text>
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 25}
                    textAnchor="middle"
                    fill={theme === "dark" ? "#cbd5e1" : "#cbd5e1"}
                    fontSize="12"
                >
                    {payload.value}
                </text>
            </Layer>
        );
    };

    return (
        <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${theme === "dark"
            ? "bg-slate-900/50 border-white/10"
            : "bg-white/50 border-[#9FE7F5]/40"
            } backdrop-blur-xl shadow-xl h-[500px]`}>
            <h3 className={`text-2xl font-black mb-6 ${theme === "dark" ? "text-white" : "text-[#053F5C]"}`}>
                {language === "ar" ? "خريطة تدفق سلسلة التوريد" : "Supply Chain Flow Map"}
            </h3>

            <ResponsiveContainer width="100%" height="100%">
                <Sankey
                    data={processedData}
                    node={<MyCustomNode />}
                    nodePadding={50}
                    margin={{
                        left: 20,
                        right: 20,
                        top: 20,
                        bottom: 20,
                    }}
                    link={{ stroke: theme === "dark" ? '#429EBD' : '#053F5C', strokeOpacity: 0.3 }}
                >
                    <Tooltip
                        contentStyle={{
                            backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            color: theme === 'dark' ? '#fff' : '#0f172a'
                        }}
                    />
                </Sankey>
            </ResponsiveContainer>
        </div>
    );
}

export default SupplyChainFlow;
