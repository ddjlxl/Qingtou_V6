import { ref, type Ref } from 'vue'
import { fleetService } from '../services/fleetService'
import type {
  Certificate, CreateCertificateRequest, UpdateCertificateRequest, CertificateListParams,
} from '../types/certificate'

type CertsRef = Ref<Certificate[]>
type LoadingRef = Ref<boolean>
type ErrorRef = Ref<string | null>

export async function fetchCertificatesAction(
  certificates: CertsRef, loading: LoadingRef, error: ErrorRef, params?: CertificateListParams,
) {
  loading.value = true
  error.value = null
  try {
    const result = await fleetService.getCertificates(params)
    certificates.value = result.items
    return result
  } catch (e) {
    error.value = e instanceof Error ? e.message : '获取证照列表失败'
  } finally {
    loading.value = false
  }
}

export async function createCertificateAction(
  certificates: CertsRef, loading: LoadingRef, error: ErrorRef, data: CreateCertificateRequest,
) {
  loading.value = true
  error.value = null
  try {
    const cert = await fleetService.createCertificate(data)
    certificates.value.unshift(cert)
    return cert
  } catch (e) {
    error.value = e instanceof Error ? e.message : '新增证照失败'
    throw e
  } finally {
    loading.value = false
  }
}

export async function updateCertificateAction(
  certificates: CertsRef, loading: LoadingRef, error: ErrorRef,
  id: string, data: UpdateCertificateRequest,
) {
  loading.value = true
  error.value = null
  try {
    const cert = await fleetService.updateCertificate(id, data)
    const index = certificates.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      certificates.value[index] = cert
    }
    return cert
  } catch (e) {
    error.value = e instanceof Error ? e.message : '编辑证照失败'
    throw e
  } finally {
    loading.value = false
  }
}

export async function deleteCertificateAction(
  certificates: CertsRef, loading: LoadingRef, error: ErrorRef, id: string,
) {
  loading.value = true
  error.value = null
  try {
    await fleetService.deleteCertificate(id)
    certificates.value = certificates.value.filter((c) => c.id !== id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除证照失败'
    throw e
  } finally {
    loading.value = false
  }
}

export function useFleetCertificates() {
  const certificates = ref<Certificate[]>([])
  const certificateLoading = ref(false)
  const certificateError = ref<string | null>(null)

  function fetchCertificates(params?: CertificateListParams) {
    return fetchCertificatesAction(certificates, certificateLoading, certificateError, params)
  }
  function createCertificate(data: CreateCertificateRequest) {
    return createCertificateAction(certificates, certificateLoading, certificateError, data)
  }
  function updateCertificate(id: string, data: UpdateCertificateRequest) {
    return updateCertificateAction(certificates, certificateLoading, certificateError, id, data)
  }
  function deleteCertificate(id: string) {
    return deleteCertificateAction(certificates, certificateLoading, certificateError, id)
  }

  function resetCertificates() {
    certificates.value = []
    certificateLoading.value = false
    certificateError.value = null
  }

  return {
    certificates, certificateLoading, certificateError,
    fetchCertificates, createCertificate, updateCertificate, deleteCertificate,
    resetCertificates,
  }
}