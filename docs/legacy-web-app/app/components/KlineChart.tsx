"use client";
import { fetchData } from "@/utils/helper";
import { createChart, ColorType } from "lightweight-charts";
import React, { useEffect, useRef, useState } from "react";
import { useLocale } from "@/i18n/LocaleProvider";

interface ChartColors {
  backgroundColor?: string;
  lineColor?: string;
  textColor?: string;
  areaTopColor?: string;
  areaBottomColor?: string;
}

interface ChartData {
  time: string;
  value: number;
}

interface ChartProps {
  data: ChartData[];
  colors?: ChartColors;
  upperPrice: number;
  lowerPrice: number;
  gridLowerLabel: string;
  gridUpperLabel: string;
}

const ChartComponent: React.FC<ChartProps> = (props) => {
  const {
    data,
    upperPrice,
    lowerPrice,
    gridLowerLabel,
    gridUpperLabel,
    colors: {
      backgroundColor = "transparent",
      lineColor = "transparent",
      textColor = "white",
      areaTopColor = "transparent",
      areaBottomColor = "rgba(41, 98, 255, 0.28)",
    } = {},
  } = props;

  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      grid: {
        vertLines: {
          color: "transparent",
        },
        horzLines: {
          color: "transparent",
        },
      },
      leftPriceScale: {
        borderVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 440,
    });
    chart.timeScale().fitContent();

    const newSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    newSeries.setData(data);

    if (lowerPrice > 0) {
      const minPriceLine = {
        price: lowerPrice,
        color: "#ef5350",
        lineStyle: 2, // LineStyle.Dashed
        axisLabelVisible: true,
        title: gridLowerLabel,
      };
      newSeries.createPriceLine(minPriceLine);
    }

    if (upperPrice > 0) {
      const maxPriceLine = {
        price: upperPrice,
        color: "#26a69a",
        lineStyle: 2, // LineStyle.Dashed
        axisLabelVisible: true,
        title: gridUpperLabel,
      };
      newSeries.createPriceLine(maxPriceLine);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [
    data,
    backgroundColor,
    lineColor,
    textColor,
    areaTopColor,
    areaBottomColor,
    lowerPrice,
    upperPrice,
    gridLowerLabel,
    gridUpperLabel,
  ]);

  return <div ref={chartContainerRef} className="min-h-[296px]" />;
};

export default function KlineChart(props: {
  poolAddress: string;
  upperPrice: number;
  lowerPrice: number;
}) {
  const { poolAddress } = props;
  const [data, setData] = useState<ChartData[]>([]);
  const { t } = useLocale();

  useEffect(() => {
    const fetchCandleStickData = async () => {
      const data = await fetchData(`/api/ohlcv/${poolAddress}`);
      const formattedData = data.data.attributes.ohlcv_list
        .map((item: number[]) => ({
          open: item[1],
          high: item[2],
          low: item[3],
          close: item[4],
          time: item[0],
          volume: item[5],
        }))
        .sort((a: { time: number }, b: { time: number }) => a.time - b.time);

      setData(formattedData);
    };

    fetchCandleStickData();
  }, [poolAddress]);

  return (
    <div className="rounded-lg h-[440px]">
      {data.length > 0 && (
        <ChartComponent
          {...props}
          data={data}
          gridLowerLabel={t.chart.gridLower}
          gridUpperLabel={t.chart.gridUpper}
        />
      )}
    </div>
  );
}
