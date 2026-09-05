(function () {
  var currentScript = document.currentScript;
  var token = currentScript.getAttribute("data-chart-token");
  var targetId = currentScript.getAttribute("data-target");
  if (!token || !targetId) {
    console.error("[SportInsider embed] data-chart-token e data-target são obrigatórios");
    return;
  }

  // Base do próprio script (funciona em dev e produção sem hardcodar domínio).
  var scriptSrc = currentScript.src;
  var base = scriptSrc.slice(0, scriptSrc.indexOf("/embed/"));

  var COLORS = ["#7F33D9", "#00A896", "#F2994A", "#EB5757", "#2D9CDB"];

  function loadEcharts(callback) {
    if (window.echarts) return callback();
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/echarts@6/dist/echarts.min.js";
    s.onload = callback;
    s.onerror = function () {
      console.error("[SportInsider embed] falha ao carregar ECharts");
    };
    document.head.appendChild(s);
  }

  function buildLineOrBarOption(chartType, data) {
    var years = data.years || [];
    var indicators = data.indicators || [];
    var series = data.series || {};
    return {
      textStyle: { fontSize: 12 },
      tooltip: { trigger: "axis" },
      legend: { show: indicators.length > 1, top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 12, right: 12, bottom: 8, top: indicators.length > 1 ? 36 : 16, containLabel: true },
      xAxis: { type: "category", data: years, axisLine: { show: false }, axisTick: { show: false } },
      yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: "#eee" } } },
      series: indicators.map(function (ind, i) {
        return {
          name: ind.label,
          type: chartType,
          data: years.map(function (y) { return (series[ind.code] || {})[y] ?? null; }),
          itemStyle: { color: COLORS[i % COLORS.length] },
        };
      }),
    };
  }

  function buildGaugeOption(data) {
    var years = data.years || [];
    var indicators = data.indicators || [];
    var series = data.series || {};
    var indicator = indicators[0];
    var lastYear = years[years.length - 1];
    var value = indicator ? (series[indicator.code] || {})[lastYear] || 0 : 0;
    var max = data.target_max || Math.max(value * 1.5, 100);
    return {
      series: [
        {
          type: "gauge",
          min: 0,
          max: max,
          progress: { show: true, width: 14 },
          axisLine: { lineStyle: { width: 14 } },
          pointer: { show: true },
          detail: { fontSize: 22, offsetCenter: [0, "40%"], formatter: function (v) { return Math.round(v).toLocaleString("pt-BR"); } },
          title: { fontSize: 12, offsetCenter: [0, "70%"] },
          data: [{ value: value, name: (indicator && indicator.label) || "" }],
        },
      ],
    };
  }

  function renderFooter(container) {
    var footer = document.createElement("div");
    footer.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:6px 4px 0;font-family:sans-serif;";
    var source = document.createElement("span");
    source.textContent = "Fonte: Sport Insider";
    source.style.cssText = "font-size:11px;color:#888;";
    var logo = document.createElement("img");
    logo.src = base + "/embed/brand-icon.svg";
    logo.alt = "Sport Insider";
    logo.style.cssText = "height:16px;width:auto;opacity:0.8;";
    footer.appendChild(source);
    footer.appendChild(logo);
    container.appendChild(footer);
  }

  function render(data) {
    var target = document.getElementById(targetId);
    if (!target) {
      console.error("[SportInsider embed] elemento #" + targetId + " não encontrado");
      return;
    }
    target.style.width = target.style.width || "100%";

    var chartDiv = document.createElement("div");
    chartDiv.style.cssText = "width:100%;height:320px;";
    target.appendChild(chartDiv);

    var option = data.chart_type === "gauge" ? buildGaugeOption(data) : buildLineOrBarOption(data.chart_type, data);
    var instance = window.echarts.init(chartDiv);
    instance.setOption(option);
    window.addEventListener("resize", function () { instance.resize(); });

    renderFooter(target);
  }

  fetch(base + "/charts/" + encodeURIComponent(token) + "/data")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      loadEcharts(function () { render(data); });
    })
    .catch(function (err) {
      console.error("[SportInsider embed] erro ao carregar gráfico:", err);
    });
})();
