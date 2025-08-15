import { Map, TileLayer } from 'leaflet';
import { getData } from './fetch-data.js';
import { HeatLayer } from './heatmap.js';

const map = new Map('map').setView([40.70860217889356, -73.89177289812899], 11);

const tiles = new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution:
		'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

let heatLayer;
const updateMap = async (includeExempt, accuracy) => {
	console.debug('Loading data');
	const {data, max} = await getData(includeExempt, accuracy);
	console.debug('Data loaded, populating heatmap', {data, max});
	if (heatLayer) {
		map.removeLayer(heatLayer);
	}
	heatLayer = new HeatLayer(data, {
		max,
	});
	map.addLayer(heatLayer);
	console.debug('Heatmap populated');
}

updateMap();

const rangeInput = document.querySelector('.input-range');
rangeInput?.addEventListener('change', ({target: {value}}) => {
	updateMap(false, value)
});
