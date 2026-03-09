"use client";

import HeatMap from "@uiw/react-heat-map";

interface Props {
  data: { date: string; count: number }[];
}

export function StudyHeatmap({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">No study activity yet</p>;
  }

  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  const values = data.map((d) => ({
    date: d.date,
    count: d.count,
  }));

  return (
    <div className="overflow-x-auto">
      <HeatMap
        value={values}
        startDate={startDate}
        endDate={new Date()}
        width={720}
        rectSize={11}
        space={3}
        style={{ color: "#6b7280", fontSize: 11 }}
        panelColors={{
          0: "#ebedf0",
          4: "#c6e48b",
          8: "#7bc96f",
          12: "#239a3b",
          32: "#196127",
        }}
        rectRender={(props, data) => {
          const title = data.date
            ? `${data.date}: ${data.count ?? 0} reviews`
            : "";
          return <rect {...props}><title>{title}</title></rect>;
        }}
      />
    </div>
  );
}
