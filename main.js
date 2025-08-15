import { Map, TileLayer } from 'leaflet';
import { getData } from './fetch-data.js';
import { HeatLayer } from './heatmap.js';

const map = new Map('map').setView([40.70860217889356, -73.89177289812899], 11);

const tiles = new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution:
		'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

console.debug('Loading data');
const {data, max} = await getData();
console.debug('Data loaded, populating heatmap', {data, max});
const heatLayer = new HeatLayer(data, {
	max,
});
heatLayer.addTo(map);
console.debug('Heatmap populated');
