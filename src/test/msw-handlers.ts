import { HttpResponse, http } from 'msw'

const API = '*/api/v1'

export const handlers = [
  http.post(`${API}/login`, async ({ request }) => {
    const body = (await request.json()) as {
      username: string
      password: string
    }
    if (body.username === 'admin' && body.password === 'admin') {
      return HttpResponse.json({
        username: 'admin',
        roles: ['ADMIN'],
      })
    }
    if (body.username === 'tesorero' && body.password === 'tesorero') {
      return HttpResponse.json({
        username: 'tesorero',
        roles: ['TREASURER', 'ADMIN'],
      })
    }
    return new HttpResponse(null, { status: 401 })
  }),

  http.get(`${API}/reports/balance`, ({ request }) => {
    const url = new URL(request.url)
    const from = url.searchParams.get('from') ?? '2026-04-01'
    const to = url.searchParams.get('to') ?? '2026-04-30'
    return HttpResponse.json({
      from,
      to,
      totalIncome: 5000,
      totalExpenses: 3000,
      netBalance: 2000,
    })
  }),

  http.get(`${API}/reports/donations`, ({ request }) => {
    const url = new URL(request.url)
    const from = url.searchParams.get('from') ?? '2026-04-01'
    const to = url.searchParams.get('to') ?? '2026-04-30'
    return HttpResponse.json({
      from,
      to,
      totalsByType: [
        { type: 'TITHE', total: 3000 },
        { type: 'OFFERING', total: 2000 },
      ],
      grandTotal: 5000,
    })
  }),

  http.get(`${API}/reports/expenses`, ({ request }) => {
    const url = new URL(request.url)
    const from = url.searchParams.get('from') ?? '2026-04-01'
    const to = url.searchParams.get('to') ?? '2026-04-30'
    return HttpResponse.json({
      from,
      to,
      totalsByCategory: [
        { category: 'RENT', total: 1500 },
        { category: 'UTILITIES', total: 1500 },
      ],
      grandTotal: 3000,
    })
  }),

  http.get(`${API}/users`, () => {
    return HttpResponse.json({
      content: [
        {
          id: 1,
          username: 'admin',
          fullName: 'Admin User',
          email: 'admin@church.org',
          active: true,
          roles: ['ADMIN'],
        },
      ],
      totalElements: 5,
      totalPages: 5,
      size: 1,
      number: 0,
    })
  }),
]
