import { PieChart } from '@mui/x-charts/PieChart';

export default function GraficoPizzaReceitas() {

    const desktopOS = [
        {
            label: 'Windows',
            value: 72.72,
        },
        {
            label: 'OS X',
            value: 16.38,
        },
        {
            label: 'Linux',
            value: 3.83,
        },
        {
            label: 'Chrome OS',
            value: 2.42,
        },
        {
            label: 'Other',
            value: 4.65,
        },
    ];

  return (
    <PieChart
      series={[
        {
          data: desktopOS,
          innerRadius: 70,
          highlightScope: { fade: 'global', highlight: 'item' },
          faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
        },
      ]}
      height={200}
      width={200}
    />
  );
}
