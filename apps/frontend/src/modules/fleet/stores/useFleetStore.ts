import { defineStore } from 'pinia'
import { useFleetVehicles } from './useFleetVehicles'
import { useFleetDrivers } from './useFleetDrivers'
import { useFleetCertificates } from './useFleetCertificates'
import { useFleetTransport } from './useFleetTransport'
import { useFleetStatistics } from './useFleetStatistics'

export const useFleetStore = defineStore('fleet', () => {
  const vehicles = useFleetVehicles()
  const drivers = useFleetDrivers()
  const certificates = useFleetCertificates()
  const transport = useFleetTransport()
  const stats = useFleetStatistics()

  function resetState() {
    vehicles.resetVehicles()
    drivers.resetDrivers()
    certificates.resetCertificates()
    transport.resetTransport()
    stats.resetStatistics()
  }

  return {
    ...vehicles,
    ...drivers,
    ...certificates,
    ...transport,
    ...stats,
    resetState,
  }
})