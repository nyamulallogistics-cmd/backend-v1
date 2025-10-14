# Frontend Integration Examples for Dashboard Pages

This guide provides complete integration examples for connecting your React components to the Nyamula Logistics backend.

## Table of Contents
1. [Post Load Page Integration](#post-load-page-integration)
2. [Shipments Page Integration](#shipments-page-integration)
3. [Dashboard Pages Integration](#dashboard-pages-integration)
4. [Common Utilities](#common-utilities)

---

## Post Load Page Integration

### Complete Implementation for `PostLoad.tsx`

```typescript
import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner'; // or your toast library

const PostLoad = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pickupDate, setPickupDate] = useState<Date>();
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [formData, setFormData] = useState({
    cargoType: '',
    cargo: '',
    cargoDescription: '',
    weight: '',
    dimensions: '',
    pickupLocation: '',
    pickupAddress: '',
    deliveryLocation: '',
    deliveryAddress: '',
    specialInstructions: '',
    estimatedValue: '',
    insuranceRequired: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3000/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cargo: formData.cargo || `${formData.cargoType} - ${formData.cargoDescription}`,
          cargoType: formData.cargoType,
          cargoDescription: formData.cargoDescription,
          weight: parseFloat(formData.weight) * 1000, // Convert tons to kg
          dimensions: formData.dimensions,
          fromLocation: formData.pickupLocation,
          fromAddress: formData.pickupAddress,
          toLocation: formData.deliveryLocation,
          toAddress: formData.deliveryAddress,
          estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
          insuranceRequired: formData.insuranceRequired,
          specialInstructions: formData.specialInstructions,
          pickupDate: pickupDate?.toISOString(),
          deliveryDate: deliveryDate?.toISOString(),
          // Expiration date: 7 days from now
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to post load');
      }

      const data = await response.json();
      
      toast.success('Load posted successfully!', {
        description: 'Transporters can now bid on your load.',
      });
      
      navigate('/dashboard/cargo-owner');
    } catch (error: any) {
      toast.error('Error posting load', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your component
};
```

### API Request Example

```typescript
// POST /api/quotes - Create a new quote (post load)
const postLoad = async (loadData) => {
  const response = await fetch('http://localhost:3000/api/quotes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      cargo: 'Mining Equipment',
      cargoType: 'mining',
      cargoDescription: 'Heavy mining equipment requiring careful handling',
      weight: 15000, // in kg
      dimensions: '6 x 2.4 x 2.6',
      fromLocation: 'Lusaka',
      fromAddress: '123 Industrial Area, Lusaka',
      toLocation: 'Ndola',
      toAddress: '456 Mining Road, Ndola',
      estimatedValue: 50000,
      insuranceRequired: true,
      specialInstructions: 'Handle with care, fragile equipment',
      pickupDate: '2024-02-01T08:00:00Z',
      deliveryDate: '2024-02-03T17:00:00Z',
      expiresAt: '2024-01-25T23:59:59Z',
    }),
  });
  
  return response.json();
};
```

---

## Shipments Page Integration

### Complete Implementation for `Shipments.tsx`

```typescript
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Shipment {
  id: string;
  cargo: string;
  cargoDescription?: string;
  weight: number;
  fromLocation: string;
  fromAddress?: string;
  toLocation: string;
  toAddress?: string;
  status: string;
  transporter?: {
    companyName: string;
  };
  driverName?: string;
  driverPhone?: string;
  truckNumber?: string;
  amount: number;
  pickupDate?: string;
  eta: string;
  deliveryDate?: string;
  completedAt?: string;
  progress: number;
  lastUpdate?: string;
  lastUpdateTime?: string;
}

const Shipments = () => {
  const [activeShipments, setActiveShipments] = useState<Shipment[]>([]);
  const [completedShipments, setCompletedShipments] = useState<Shipment[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    inTransit: 0,
    completed: 0,
    totalValue: 0,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipments();
    fetchStats();
  }, []);

  const fetchShipments = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch active shipments
      const activeResponse = await fetch(
        'http://localhost:3000/api/shipments/active',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const activeData = await activeResponse.json();
      setActiveShipments(activeData);

      // Fetch completed shipments
      const completedResponse = await fetch(
        'http://localhost:3000/api/shipments/completed',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const completedData = await completedResponse.json();
      setCompletedShipments(completedData);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        'http://localhost:3000/api/shipments/stats',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!search) {
      fetchShipments();
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/shipments?search=${encodeURIComponent(search)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      
      // Separate active and completed
      const active = data.filter((s: Shipment) => 
        ['PENDING_PICKUP', 'AWAITING_PICKUP', 'IN_TRANSIT'].includes(s.status)
      );
      const completed = data.filter((s: Shipment) => s.status === 'DELIVERED');
      
      setActiveShipments(active);
      setCompletedShipments(completed);
    } catch (error) {
      console.error('Error searching shipments:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `K ${amount.toLocaleString()}`;
  };

  const formatWeight = (kg: number) => {
    return `${(kg / 1000).toFixed(1)} tons`;
  };

  // ... rest of your component with the UI
};
```

### Update Shipment Status (Transporter)

```typescript
const updateShipmentStatus = async (shipmentId: string, updateData: any) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    `http://localhost:3000/api/shipments/${shipmentId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    }
  );
  
  return response.json();
};

// Example: Mark as picked up
await updateShipmentStatus('shipment-id', {
  status: 'IN_TRANSIT',
  progress: 0,
  pickupDate: new Date().toISOString(),
  lastUpdate: 'Lusaka - Cargo picked up',
});

// Example: Update progress
await updateShipmentStatus('shipment-id', {
  progress: 65,
  lastUpdate: 'Kasama - 2 hours ago',
});

// Example: Mark as delivered
await updateShipmentStatus('shipment-id', {
  status: 'DELIVERED',
  progress: 100,
  deliveryDate: new Date().toISOString(),
  lastUpdate: 'Delivered successfully',
});
```

---

## Dashboard Pages Integration

### Cargo Owner Dashboard

```typescript
const CargoOwnerDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  useEffect(() => {
    fetchDashboard();
  }, []);
  
  const fetchDashboard = async () => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(
      'http://localhost:3000/api/dashboard/cargo-owner',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    const data = await response.json();
    setDashboardData(data);
  };
  
  if (!dashboardData) return <div>Loading...</div>;
  
  return (
    <DashboardLayout role="cargo-owner">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-6">
          <StatsCard
            title="Active Shipments"
            value={dashboardData.stats.activeShipments.value}
            description={`${dashboardData.stats.activeShipments.awaitingPickup} awaiting pickup`}
          />
          {/* ... more stats */}
        </div>
        
        {/* Active Shipments */}
        <div>
          <h2>Active Shipments</h2>
          {dashboardData.activeShipments.map((shipment) => (
            <ShipmentCard key={shipment.id} shipment={shipment} />
          ))}
        </div>
        
        {/* Recent Quotes */}
        <div>
          <h2>Pending Quotes</h2>
          {dashboardData.recentQuotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
```

### Transporter Dashboard

```typescript
const TransporterDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  useEffect(() => {
    fetchDashboard();
  }, []);
  
  const fetchDashboard = async () => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(
      'http://localhost:3000/api/dashboard/transporter',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    const data = await response.json();
    setDashboardData(data);
  };
  
  const placeBid = async (quoteId: string, bidData: any) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(
      `http://localhost:3000/api/quotes/${quoteId}/bids`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bidData),
      }
    );
    
    if (response.ok) {
      toast.success('Bid placed successfully!');
      fetchDashboard(); // Refresh dashboard
    }
  };
  
  // ... rest of component
};
```

---

## Common Utilities

### API Client

```typescript
// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class ApiClient {
  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    return response.json();
  }

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    return response.json();
  }

  async patch(endpoint: string, data: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    return response.json();
  }

  async delete(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    return response.json();
  }
}

export const api = new ApiClient();
```

### Usage with API Client

```typescript
import { api } from '@/lib/api';

// Post a load
const postLoad = async (loadData) => {
  return api.post('/quotes', loadData);
};

// Get active shipments
const getActiveShipments = async () => {
  return api.get('/shipments/active');
};

// Update shipment
const updateShipment = async (id: string, data: any) => {
  return api.patch(`/shipments/${id}`, data);
};

// Place bid
const placeBid = async (quoteId: string, bidData: any) => {
  return api.post(`/quotes/${quoteId}/bids`, bidData);
};
```

### Type Definitions

```typescript
// src/types/index.ts

export enum ShipmentStatus {
  PENDING_PICKUP = 'PENDING_PICKUP',
  AWAITING_PICKUP = 'AWAITING_PICKUP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface Shipment {
  id: string;
  cargo: string;
  cargoDescription?: string;
  fromLocation: string;
  fromAddress?: string;
  toLocation: string;
  toAddress?: string;
  status: ShipmentStatus;
  amount: number;
  eta: string;
  progress: number;
  weight: number;
  distance: number;
  dimensions?: string;
  pickupDate?: string;
  deliveryDate?: string;
  completedAt?: string;
  driverName?: string;
  driverPhone?: string;
  truckNumber?: string;
  lastUpdate?: string;
  lastUpdateTime?: string;
  cargoOwner: User;
  transporter?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  cargo: string;
  cargoType?: string;
  cargoDescription?: string;
  fromLocation: string;
  fromAddress?: string;
  toLocation: string;
  toAddress?: string;
  weight: number;
  distance: number;
  dimensions?: string;
  estimatedValue?: number;
  insuranceRequired: boolean;
  specialInstructions?: string;
  pickupDate?: string;
  deliveryDate?: string;
  status: 'ACTIVE' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  cargoOwner: User;
  bids: Bid[];
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: string;
  amount: number;
  estimatedDays: number;
  notes?: string;
  isAccepted: boolean;
  transporter: User;
  createdAt: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  companyName: string;
  phoneNumber: string;
  role: 'CARGO_OWNER' | 'TRANSPORTER';
}
```

---

## Environment Variables

Create a `.env` file in your frontend project:

```env
VITE_API_URL=http://localhost:3000/api
```

For production:

```env
VITE_API_URL=https://your-backend-domain.com/api
```

---

## Complete Workflow Example

### 1. Cargo Owner Posts a Load

```typescript
// User fills out the PostLoad form and submits
const handlePostLoad = async () => {
  const quoteData = {
    cargo: 'Mining Equipment',
    cargoType: 'mining',
    cargoDescription: 'Heavy drilling machinery',
    weight: 15000, // kg
    dimensions: '6 x 2.4 x 2.6',
    fromLocation: 'Lusaka',
    fromAddress: '123 Industrial Area',
    toLocation: 'Ndola',
    toAddress: '456 Mining Site',
    pickupDate: '2024-02-01T08:00:00Z',
    deliveryDate: '2024-02-03T17:00:00Z',
    estimatedValue: 50000,
    insuranceRequired: true,
    specialInstructions: 'Requires flatbed truck',
    expiresAt: '2024-01-25T23:59:59Z',
  };
  
  const quote = await api.post('/quotes', quoteData);
  // Navigate to dashboard
};
```

### 2. Transporter Views and Bids

```typescript
// Transporter sees the load on their dashboard
const handlePlaceBid = async (quoteId: string) => {
  const bidData = {
    amount: 8500,
    estimatedDays: 3,
    notes: 'Specialized equipment available',
  };
  
  await api.post(`/quotes/${quoteId}/bids`, bidData);
};
```

### 3. Cargo Owner Accepts Bid

```typescript
// Cargo owner reviews bids and accepts one
const handleAcceptBid = async (quoteId: string, bidId: string) => {
  // This automatically creates a shipment
  const shipment = await api.post(
    `/quotes/${quoteId}/bids/${bidId}/accept`,
    {}
  );
  
  // Shipment is now created and visible on shipments page
};
```

### 4. Transporter Updates Shipment

```typescript
// Transporter picks up cargo
await api.patch(`/shipments/${shipmentId}`, {
  status: 'IN_TRANSIT',
  progress: 0,
  pickupDate: new Date().toISOString(),
  driverName: 'John Mwansa',
  driverPhone: '+260 975 123 456',
  truckNumber: 'ZM-LU-1234',
  lastUpdate: 'Lusaka - Cargo picked up',
});

// Transporter updates progress
await api.patch(`/shipments/${shipmentId}`, {
  progress: 50,
  lastUpdate: 'Kabwe - Halfway point',
});

// Transporter delivers cargo
await api.patch(`/shipments/${shipmentId}`, {
  status: 'DELIVERED',
  progress: 100,
  deliveryDate: new Date().toISOString(),
  lastUpdate: 'Ndola - Delivered successfully',
});
```

---

## Error Handling

```typescript
const handleApiError = (error: any) => {
  if (error.message.includes('401')) {
    // Unauthorized - redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
  } else if (error.message.includes('403')) {
    toast.error('Access denied');
  } else if (error.message.includes('404')) {
    toast.error('Resource not found');
  } else {
    toast.error('An error occurred', {
      description: error.message,
    });
  }
};

// Usage
try {
  await api.post('/quotes', quoteData);
} catch (error) {
  handleApiError(error);
}
```

---

**Happy Integrating! 🚀**

