import ky, { isHTTPError, type BeforeErrorState } from 'ky'

const apiClient = ky.create({
  prefix: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
  credentials: 'include',
  hooks: {
    beforeError: [
      async ({ error }: BeforeErrorState): Promise<Error> => {
        if (isHTTPError(error)) {
          const body = await error.response.json<{ message?: string }>().catch(() => ({}))
          const message = 'message' in body ? body.message : undefined
          if (message) error.message = message
        }
        return error
      },
    ],
  },
})

export default apiClient
