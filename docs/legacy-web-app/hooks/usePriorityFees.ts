import { useGlobalStore } from "@/app/components/providers/StoreProvider";
import { Priority } from "@/store/globalStore";
import { fetchData } from "@/utils/helper";
import { useEffect, useState } from "react";

interface PriorityFees {
  Low: number;
  Medium: number;
  High: number;
}

export const usePriorityFees = () => {
  const [priorityFees, setPriorityFees] = useState<PriorityFees>({
    Low: 0,
    Medium: 1000,
    High: 10000,
  });

  const [currentSelected, setCurrentSelected] = useState<Priority>("Medium");

  const { updatePriorityFee } = useGlobalStore((state) => state);

  useEffect(() => {
    const fetchPriorityFees = async () => {
      try {
        const { recentPriorityFees } = await fetchData("/api/fees");

        setPriorityFees({
          Low: recentPriorityFees.result.per_compute_unit.low,
          Medium: recentPriorityFees.result.per_compute_unit.medium,
          High: recentPriorityFees.result.per_compute_unit.high,
        });

        updatePriorityFee(
          recentPriorityFees.result.per_compute_unit[currentSelected]
        );
      } catch (error) {
        console.error("Error fetching priority fees:", error);
      }
    };

    fetchPriorityFees();

    const intervalId = setInterval(fetchPriorityFees, 1000 * 60 * 3);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { priorityFees, currentSelected, setCurrentSelected };
};
