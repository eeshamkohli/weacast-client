import L from 'leaflet'
import 'leaflet-timedimension'
import 'leaflet-timedimension/dist/leaflet.timedimension.control.css'
import moment from 'moment'
import 'iso8601-js-period/iso8601.js'
import '../../layers'

import store from '../store'

let forecastLayersMixin = {
  data () {
    return {
      currentTime: null
    }
  },
  watch: {
    forecastModel: function (model) {
      this.setupForecastLayers()
    }
  },
  methods: {
    setupForecastLayers () {
      // Not yet ready
      if (!this.forecastModel || !this.map || !this.map.timeDimension) return
      // For visualization we decimate the data resolution by 2 for performance reasons
      let visualModel = {
        name: this.forecastModel.name,
        origin: this.forecastModel.origin,
        bounds: this.forecastModel.bounds,
        size: [Math.floor(0.5 * this.forecastModel.size[0]), Math.floor(0.5 * this.forecastModel.size[1])],
        resolution: [2 * this.forecastModel.resolution[0], 2 * this.forecastModel.resolution[1]]
      }

      this.forecastLayers.forEach(layer => this.removeLayer(layer))
      this.forecastLayers = []
      this.configuration.forecastLayers.forEach(layerConfig => {
        let layer = new L.Weacast[layerConfig.type](this.api, layerConfig.options)
        this.addLayer(layer, layerConfig.name)
        // Should come last so that we do not trigger multiple updates of data
        layer.setForecastModel(visualModel)
        this.forecastLayers.push(layer)
      })
    },
    setCurrentTime (datetime) {
      // String or milliseconds
      if (typeof datetime === 'string' || Number.isInteger(datetime)) {
        this.currentTime = moment.utc(datetime)
      } else {
        this.currentTime = datetime
      }
      this.$emit('currentTimeChanged', this.currentTime)
      // Synchronize UI when the time has been set programmatically
      if (this.map.timeDimension.getCurrentTime() !== this.currentTime.valueOf()) {
        this.map.timeDimension.setCurrentTime(this.currentTime.valueOf())
      }
    }
  },
  created () {
    // This is the right place to declare private members because Vue has already processed observed data
    this.forecastLayers = []
  },
  mounted () {
    let timeDimension = L.timeDimension({})
    timeDimension.on('timeload', data => {
      this.setCurrentTime(data.time)
    })
    let timeDimensionControl = L.control.timeDimension({
      timeDimension,
      position: 'bottomright',
      speedSlider: false,
      playButton: false
    })
    this.controls.push(timeDimensionControl)
    // Make time dimension available
    this.$on('mapReady', _ => {
      this.map.timeDimension = timeDimension
      this.setupForecastLayers()
    })
  }
}

store.set('forecastLayers', forecastLayersMixin)

export default forecastLayersMixin
