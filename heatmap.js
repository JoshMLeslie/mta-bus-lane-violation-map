import { Bounds, Browser, DomUtil, LatLngBounds, Layer } from 'leaflet';
import SimpleHeat from './simpleheat.js';

export class HeatLayer extends Layer {
	constructor(latlngs, options = {}) {
		super(options);
		this._latlngs = latlngs;
	}

	setLatLngs(latlngs) {
		this._latlngs = latlngs;
		return this.redraw();
	}

	addLatLng(latlng) {
		this._latlngs.push(latlng);
		return this.redraw();
	}

	setOptions(options) {
		Object.assign(this.options, options);
		if (this._heat) this._updateOptions();
		return this.redraw();
	}

	getBounds() {
		return new LatLngBounds(this._latlngs);
	}

	redraw() {
		if (this._heat && !this._frame && this._map && !this._map._animating) {
			this._frame = requestAnimationFrame(() => this._redraw());
		}
		return this;
	}

	onAdd(map) {
		this._map = map;
		if (!this._canvas) this._initCanvas();

		const pane = this.options.pane
			? this.getPane()
			: map.getPanes().overlayPane;
		pane.appendChild(this._canvas);

		map.on('moveend', this._reset, this);
		if (map.options.zoomAnimation && Browser.any3d) {
			map.on('zoomanim', this._animateZoom, this);
		}
		this._reset();
	}

	onRemove(map) {
		const pane = this.options.pane
			? this.getPane()
			: map.getPanes().overlayPane;
		pane.removeChild(this._canvas);

		map.off('moveend', this._reset, this);
		if (map.options.zoomAnimation) {
			map.off('zoomanim', this._animateZoom, this);
		}
	}

	_initCanvas() {
		const canvas = (this._canvas = DomUtil.create(
			'canvas',
			'leaflet-heatmap-layer leaflet-layer'
		));
		canvas.style.transformOrigin = '50% 50%';

		const size = this._map.getSize();
		canvas.width = size.x;
		canvas.height = size.y;

		const animated = this._map.options.zoomAnimation && Browser.any3d;
		canvas.classList.add('leaflet-zoom-' + (animated ? 'animated' : 'hide'));

		this._heat = new SimpleHeat(canvas);
		this._updateOptions();
	}

	_updateOptions() {
		this._heat.radius(
			this.options.radius || this._heat.defaultRadius,
			this.options.blur
		);
		if (this.options.gradient) this._heat.gradient(this.options.gradient);
		if (this.options.max) this._heat.max(this.options.max);
	}

	_reset() {
		const topLeft = this._map.containerPointToLayerPoint([0, 0]);
		DomUtil.setPosition(this._canvas, topLeft);

		const size = this._map.getSize();
		if (this._heat._width !== size.x) {
			this._canvas.width = this._heat._width = size.x;
		}
		if (this._heat._height !== size.y) {
			this._canvas.height = this._heat._height = size.y;
		}
		this._redraw();
	}

	_redraw() {
		if (!this._map) return;

		const data = [];
		const grid = [];
		const size = this._map.getSize();
		const max = this.options.max ?? 1;
		
		const r = this._heat._r;
		const bounds = new Bounds([-r, -r], size.add([r, r]));
		const cellSize = r / 2;
		
		const panePos = this._map._getMapPanePos();
		const offsetX = panePos.x % cellSize;
		const offsetY = panePos.y % cellSize;

		const maxZoom = this.options.maxZoom ?? this._map.getMaxZoom();
		const v =
			1 / Math.pow(2, Math.max(0, Math.min(maxZoom - this._map.getZoom(), 12)));

		for (let i = 0; i < this._latlngs.length; i++) {
			const p = this._map.latLngToContainerPoint(this._latlngs[i]);
			if (!bounds.contains(p)) continue;

			const x = Math.floor((p.x - offsetX) / cellSize) + 2;
			const y = Math.floor((p.y - offsetY) / cellSize) + 2;

			const alt = this._latlngs[i].alt ?? this._latlngs[i][2] ?? 1;
			const k = alt * v;

			grid[y] = grid[y] || [];
			const cell = grid[y][x];
			if (!cell) {
				grid[y][x] = [p.x, p.y, k];
			} else {
				cell[0] = (cell[0] * cell[2] + p.x * k) / (cell[2] + k);
				cell[1] = (cell[1] * cell[2] + p.y * k) / (cell[2] + k);
				cell[2] += k;
			}
		}

		for (let row of grid) {
			if (!row) continue;
			for (let cell of row) {
				if (cell) {
					data.push([
						Math.round(cell[0]),
						Math.round(cell[1]),
						Math.min(cell[2], max),
					]);
				}
			}
		}

		this._heat.data(data).draw(this.options.minOpacity);
		this._frame = null;
	}

	_animateZoom(e) {
		const scale = this._map.getZoomScale(e.zoom);
		const offset = this._map
			._getCenterOffset(e.center)
			._multiplyBy(-scale)
			.subtract(this._map._getMapPanePos());
		DomUtil.setTransform(this._canvas, offset, scale);
	}
}
