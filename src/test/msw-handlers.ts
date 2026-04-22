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

  http.get(`${API}/donations`, () => {
    return HttpResponse.json({
      content: [
        {
          id: 1,
          amount: 100,
          donationDate: '2026-04-15',
          donationType: 'TITHE',
          paymentMethod: 'CASH',
          donorId: 1,
          donorName: 'Juan Pérez',
          notes: null,
          createdAt: '2026-04-15T10:00:00',
          updatedAt: '2026-04-15T10:00:00',
        },
        {
          id: 2,
          amount: 50,
          donationDate: '2026-04-16',
          donationType: 'OFFERING',
          paymentMethod: 'BANK_TRANSFER',
          donorId: null,
          donorName: null,
          notes: 'Test',
          createdAt: '2026-04-16T10:00:00',
          updatedAt: '2026-04-16T10:00:00',
        },
      ],
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0,
    })
  }),

  http.get(`${API}/donations/:id`, ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      amount: 100,
      donationDate: '2026-04-15',
      donationType: 'TITHE',
      paymentMethod: 'CASH',
      donorId: 1,
      donorName: 'Juan Pérez',
      notes: null,
      createdAt: '2026-04-15T10:00:00',
      updatedAt: '2026-04-15T10:00:00',
    })
  }),

  http.post(`${API}/donations`, async ({ request }) => {
    const body = (await request.json()) as { confirmDuplicate?: boolean }
    if (body.confirmDuplicate) {
      return HttpResponse.json({
        donation: {
          id: 3,
          amount: 100,
          donationDate: '2026-04-15',
          donationType: 'TITHE',
          paymentMethod: 'CASH',
          donorId: null,
          donorName: null,
          notes: null,
          createdAt: '2026-04-15T10:00:00',
          updatedAt: '2026-04-15T10:00:00',
        },
        duplicateWarning: false,
        saved: true,
      })
    }
    return HttpResponse.json({
      donation: {
        id: 3,
        amount: 100,
        donationDate: '2026-04-15',
        donationType: 'TITHE',
        paymentMethod: 'CASH',
        donorId: null,
        donorName: null,
        notes: null,
        createdAt: '2026-04-15T10:00:00',
        updatedAt: '2026-04-15T10:00:00',
      },
      duplicateWarning: false,
      saved: true,
    })
  }),

  http.put(`${API}/donations/:id`, () => {
    return HttpResponse.json({
      id: 1,
      amount: 200,
      donationDate: '2026-04-15',
      donationType: 'TITHE',
      paymentMethod: 'CASH',
      donorId: 1,
      donorName: 'Juan Pérez',
      notes: null,
      createdAt: '2026-04-15T10:00:00',
      updatedAt: '2026-04-15T12:00:00',
    })
  }),

  http.get(`${API}/donors`, () => {
    return HttpResponse.json({
      content: [
        {
          id: 1,
          fullName: 'Juan Pérez',
          dniNie: '12345678A',
          email: 'juan@test.com',
          phone: null,
          address: null,
          active: true,
          createdAt: '2026-01-01T10:00:00',
          updatedAt: '2026-01-01T10:00:00',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 100,
      number: 0,
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
