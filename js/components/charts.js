// js/components/charts.js

// Reusable Chart Component System
class ChartSystem {
    constructor() {
        this.charts = new Map();
        this.colors = {
            primary: '#007bff',
            secondary: '#6c757d',
            success: '#28a745',
            danger: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8',
            light: '#f8f9fa',
            dark: '#343a40'
        };
        this.init();
    }

    init() {
        this.injectChartStyles();
    }

    // Inject chart CSS styles
    injectChartStyles() {
        if (document.getElementById('chart-styles')) return;

        const styles = `
            .babeh-chart-container {
                background: white;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .chart-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .chart-title {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
                color: #333;
            }

            .chart-actions {
                display: flex;
                gap: 10px;
            }

            .chart-wrapper {
                position: relative;
                height: 300px;
            }

            .chart-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #666;
            }

            .chart-legend {
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
                margin-top: 16px;
                justify-content: center;
            }

            .legend-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }

            .legend-color {
                width: 12px;
                height: 12px;
                border-radius: 2px;
            }

            .chart-tooltip {
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .chart-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 10px;
                }

                .chart-actions {
                    width: 100%;
                    justify-content: flex-start;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.id = 'chart-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Create bar chart
    createBarChart(options = {}) {
        const {
            id = `chart-${Date.now()}`,
            title = 'Bar Chart',
            data = [],
            xKey = 'label',
            yKey = 'value',
            color = this.colors.primary,
            showLegend = true,
            showGrid = true,
            onPointClick = null
        } = options;

        const chartHTML = `
            <div class="babeh-chart-container" id="${id}">
                <div class="chart-header">
                    <h3 class="chart-title">${title}</h3>
                    <div class="chart-actions">
                        <button class="btn btn-sm btn-secondary chart-export">📊 Export</button>
                    </div>
                </div>
                <div class="chart-wrapper">
                    <canvas id="${id}-canvas"></canvas>
                </div>
                ${showLegend ? this.renderLegend(data, color) : ''}
            </div>
        `;

        // Store chart configuration
        this.charts.set(id, {
            type: 'bar',
            data,
            options,
            canvas: null,
            context: null
        });

        return chartHTML;
    }

    // Create line chart
    createLineChart(options = {}) {
        const {
            id = `chart-${Date.now()}`,
            title = 'Line Chart',
            data = [],
            xKey = 'label',
            yKey = 'value',
            color = this.colors.primary,
            fill = false,
            showLegend = true
        } = options;

        const chartHTML = `
            <div class="babeh-chart-container" id="${id}">
                <div class="chart-header">
                    <h3 class="chart-title">${title}</h3>
                    <div class="chart-actions">
                        <button class="btn btn-sm btn-secondary chart-export">📊 Export</button>
                    </div>
                </div>
                <div class="chart-wrapper">
                    <canvas id="${id}-canvas"></canvas>
                </div>
                ${showLegend ? this.renderLegend(data, color) : ''}
            </div>
        `;

        this.charts.set(id, {
            type: 'line',
            data,
            options: { ...options, fill },
            canvas: null,
            context: null
        });

        return chartHTML;
    }

    // Create pie chart
    createPieChart(options = {}) {
        const {
            id = `chart-${Date.now()}`,
            title = 'Pie Chart',
            data = [],
            showLegend = true
        } = options;

        const chartHTML = `
            <div class="babeh-chart-container" id="${id}">
                <div class="chart-header">
                    <h3 class="chart-title">${title}</h3>
                    <div class="chart-actions">
                        <button class="btn btn-sm btn-secondary chart-export">📊 Export</button>
                    </div>
                </div>
                <div class="chart-wrapper">
                    <canvas id="${id}-canvas"></canvas>
                </div>
                ${showLegend ? this.renderPieLegend(data) : ''}
            </div>
        `;

        this.charts.set(id, {
            type: 'pie',
            data,
            options,
            canvas: null,
            context: null
        });

        return chartHTML;
    }

    // Render legend for charts
    renderLegend(data, color) {
        if (!data.length) return '';

        return `
            <div class="chart-legend">
                ${data.map((item, index) => `
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: ${this.getColor(index, color)}"></div>
                        <span>${item.label || item.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Render legend for pie chart
    renderPieLegend(data) {
        if (!data.length) return '';

        return `
            <div class="chart-legend">
                ${data.map((item, index) => `
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: ${this.getColor(index)}"></div>
                        <span>${item.label || item.name}: ${item.value}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Get color for chart elements
    getColor(index, baseColor = null) {
        const colorPalette = [
            this.colors.primary,
            this.colors.success,
            this.colors.warning,
            this.colors.danger,
            this.colors.info,
            this.colors.secondary,
            '#6610f2',
            '#e83e8c',
            '#fd7e14',
            '#20c997'
        ];

        return baseColor || colorPalette[index % colorPalette.length];
    }

    // Initialize and render chart
    init(chartId) {
        const chartConfig = this.charts.get(chartId);
        if (!chartConfig) return;

        const canvas = document.getElementById(`${chartId}-canvas`);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        chartConfig.canvas = canvas;
        chartConfig.context = ctx;

        // Set canvas size
        this.setCanvasSize(canvas);

        // Render based on chart type
        switch (chartConfig.type) {
            case 'bar':
                this.renderBarChart(chartConfig);
                break;
            case 'line':
                this.renderLineChart(chartConfig);
                break;
            case 'pie':
                this.renderPieChart(chartConfig);
                break;
        }

        // Setup events
        this.setupChartEvents(chartId, chartConfig);
    }

    // Set canvas size
    setCanvasSize(canvas) {
        const container = canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;

        canvas.width = width;
        canvas.height = height;
    }

    // Render bar chart
    renderBarChart(config) {
        const { context, data, options } = config;
        const { color, xKey = 'label', yKey = 'value', showGrid = true } = options;

        const width = config.canvas.width;
        const height = config.canvas.height;
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Clear canvas
        context.clearRect(0, 0, width, height);

        // Draw grid
        if (showGrid) {
            this.drawGrid(context, width, height, padding);
        }

        // Calculate scales
        const maxValue = Math.max(...data.map(item => item[yKey]));
        const scaleY = chartHeight / maxValue;
        const barWidth = chartWidth / data.length * 0.7;

        // Draw bars
        data.forEach((item, index) => {
            const barHeight = item[yKey] * scaleY;
            const x = padding + (index * chartWidth / data.length) + (chartWidth / data.length - barWidth) / 2;
            const y = height - padding - barHeight;

            // Draw bar
            context.fillStyle = this.getColor(index, color);
            context.fillRect(x, y, barWidth, barHeight);

            // Draw label
            context.fillStyle = '#333';
            context.font = '12px Arial';
            context.textAlign = 'center';
            context.fillText(
                item[xKey],
                x + barWidth / 2,
                height - padding + 20
            );

            // Draw value
            context.fillText(
                item[yKey].toString(),
                x + barWidth / 2,
                y - 5
            );
        });

        // Draw axes
        this.drawAxes(context, width, height, padding);
    }

    // Render line chart
    renderLineChart(config) {
        const { context, data, options } = config;
        const { color, xKey = 'label', yKey = 'value', fill = false, showGrid = true } = options;

        const width = config.canvas.width;
        const height = config.canvas.height;
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Clear canvas
        context.clearRect(0, 0, width, height);

        // Draw grid
        if (showGrid) {
            this.drawGrid(context, width, height, padding);
        }

        // Calculate scales
        const maxValue = Math.max(...data.map(item => item[yKey]));
        const scaleY = chartHeight / maxValue;

        // Draw line
        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = 2;

        data.forEach((item, index) => {
            const x = padding + (index * chartWidth / (data.length - 1));
            const y = height - padding - (item[yKey] * scaleY);

            if (index === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }

            // Draw points
            context.fillStyle = color;
            context.beginPath();
            context.arc(x, y, 4, 0, Math.PI * 2);
            context.fill();
        });

        context.stroke();

        // Fill area under line
        if (fill) {
            context.fillStyle = color + '20';
            context.lineTo(padding + chartWidth, height - padding);
            context.lineTo(padding, height - padding);
            context.closePath();
            context.fill();
        }

        // Draw axes
        this.drawAxes(context, width, height, padding);

        // Draw labels
        context.fillStyle = '#333';
        context.font = '12px Arial';
        context.textAlign = 'center';

        data.forEach((item, index) => {
            const x = padding + (index * chartWidth / (data.length - 1));
            context.fillText(
                item[xKey],
                x,
                height - padding + 20
            );
        });
    }

    // Render pie chart
    renderPieChart(config) {
        const { context, data } = config;

        const width = config.canvas.width;
        const height = config.canvas.height;
        const radius = Math.min(width, height) / 2 - 20;
        const centerX = width / 2;
        const centerY = height / 2;

        // Clear canvas
        context.clearRect(0, 0, width, height);

        // Calculate total
        const total = data.reduce((sum, item) => sum + item.value, 0);

        // Draw pie segments
        let startAngle = 0;

        data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;

            context.beginPath();
            context.moveTo(centerX, centerY);
            context.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            context.closePath();

            context.fillStyle = this.getColor(index);
            context.fill();

            // Draw label
            const labelAngle = startAngle + sliceAngle / 2;
            const labelRadius = radius * 0.7;
            const labelX = centerX + Math.cos(labelAngle) * labelRadius;
            const labelY = centerY + Math.sin(labelAngle) * labelRadius;

            context.fillStyle = '#fff';
            context.font = '12px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(item.label, labelX, labelY);

            startAngle += sliceAngle;
        });
    }

    // Draw grid lines
    drawGrid(context, width, height, padding) {
        context.strokeStyle = '#e0e0e0';
        context.lineWidth = 1;

        // Horizontal grid lines
        for (let y = padding; y <= height - padding; y += (height - padding * 2) / 5) {
            context.beginPath();
            context.moveTo(padding, y);
            context.lineTo(width - padding, y);
            context.stroke();
        }

        // Vertical grid lines
        for (let x = padding; x <= width - padding; x += (width - padding * 2) / 10) {
            context.beginPath();
            context.moveTo(x, padding);
            context.lineTo(x, height - padding);
            context.stroke();
        }
    }

    // Draw axes
    drawAxes(context, width, height, padding) {
        context.strokeStyle = '#333';
        context.lineWidth = 2;

        // X axis
        context.beginPath();
        context.moveTo(padding, height - padding);
        context.lineTo(width - padding, height - padding);
        context.stroke();

        // Y axis
        context.beginPath();
        context.moveTo(padding, padding);
        context.lineTo(padding, height - padding);
        context.stroke();
    }

    // Setup chart events
    setupChartEvents(chartId, config) {
        const container = document.getElementById(chartId);
        if (!container) return;

        // Export button
        const exportBtn = container.querySelector('.chart-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportChart(chartId);
            });
        }

        // Click events for interactive charts
        if (config.options.onPointClick) {
            config.canvas.addEventListener('click', (e) => {
                this.handleChartClick(e, config);
            });
        }
    }

    // Handle chart click
    handleChartClick(event, config) {
        const rect = config.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Basic click detection (simplified)
        // In real implementation, you'd calculate which data point was clicked
        console.log('Chart clicked at:', x, y);
    }

    // Export chart as image
    exportChart(chartId) {
        const chartConfig = this.charts.get(chartId);
        if (!chartConfig || !chartConfig.canvas) return;

        const link = document.createElement('a');
        link.download = `chart-${chartId}-${new Date().getTime()}.png`;
        link.href = chartConfig.canvas.toDataURL();
        link.click();
    }

    // Update chart data
    updateData(chartId, newData) {
        const chartConfig = this.charts.get(chartId);
        if (chartConfig) {
            chartConfig.data = newData;
            this.init(chartId); // Re-render
        }
    }

    // Remove chart
    remove(chartId) {
        this.charts.delete(chartId);
        const container = document.getElementById(chartId);
        if (container) {
            container.remove();
        }
    }
}

// Initialize chart system
const chartSystem = new ChartSystem();

// Public API
function createBarChart(options) {
    return chartSystem.createBarChart(options);
}

function createLineChart(options) {
    return chartSystem.createLineChart(options);
}

function createPieChart(options) {
    return chartSystem.createPieChart(options);
}

function initChart(chartId) {
    chartSystem.init(chartId);
}

function updateChartData(chartId, newData) {
    chartSystem.updateData(chartId, newData);
}

function removeChart(chartId) {
    chartSystem.remove(chartId);
}