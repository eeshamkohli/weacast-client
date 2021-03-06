import L from 'leaflet'
import 'leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js'
import * as d3 from 'd3'
import chroma from 'chroma-js'
import { ForecastLayer } from './forecast-layer'

window.chroma = chroma
window.d3 = d3

let ColorLayer = ForecastLayer.extend({

  initialize (api, options) {
    // Merge options with default for undefined ones
    const layerOptions = Object.assign({
      interpolate: true,
      colorMap: 'Spectral',
      opacity: 0.25
    }, options)
    let layer = L.canvasLayer.scalarField(null, layerOptions)
    ForecastLayer.prototype.initialize.call(this, api, layer, options)
  },

  setData (data) {
    this._baseLayer.setColor(chroma.scale(this._baseLayer.options.colorMap).domain([data[0].minValue, data[0].maxValue]))
    this.field.zs = data[0].data
    // To be reactive directly set data after download
    this._baseLayer.setData(new L.ScalarField(this.field))
  },

  setForecastModel (model) {
    // Format in leaflet-canvaslayer-field layer data model
    this.field = {
      nCols: model.size[0],
      nRows: model.size[1],
      xllCorner: model.bounds[0],
      yllCorner: model.bounds[1],
      cellXSize: model.resolution[0],
      cellYSize: model.resolution[1]
    }
    ForecastLayer.prototype.setForecastModel.call(this, model)
  }
})

L.Weacast.ColorLayer = ColorLayer
export { ColorLayer }
