import { describe, it, expect } from 'vitest';
import { Lead, Profile } from '../types/crm';

describe('RLS Role Permission Simulation', () => {
  const adminUser: Profile = {
    id: 'admin-1',
    email: 'admin@realty.com',
    full_name: 'Admin User',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const agent1: Profile = {
    id: 'agent-1',
    email: 'rahul@realty.com',
    full_name: 'Rahul Sharma',
    role: 'agent',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const agent2: Profile = {
    id: 'agent-2',
    email: 'neha@realty.com',
    full_name: 'Neha Verma',
    role: 'agent',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const allLeads: Lead[] = [
    {
      id: 'lead-1',
      source: 'manual',
      full_name: 'Lead for Rahul',
      phone: '+919839000001',
      assigned_to: 'agent-1',
      lead_score: 'hot',
      status: 'new',
      consent_given: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'lead-2',
      source: 'manual',
      full_name: 'Lead for Neha',
      phone: '+919839000002',
      assigned_to: 'agent-2',
      lead_score: 'warm',
      status: 'new',
      consent_given: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'lead-3',
      source: 'manual',
      full_name: 'Unassigned Lead',
      phone: '+919839000003',
      assigned_to: null,
      lead_score: 'cold',
      status: 'new',
      consent_given: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // RLS Filter policy logic
  const applyLeadRlsFilter = (user: Profile, leads: Lead[]): Lead[] => {
    if (user.role === 'admin') {
      return leads;
    }
    return leads.filter((l) => l.assigned_to === user.id);
  };

  it('allows Admin to view all leads in CRM', () => {
    const visible = applyLeadRlsFilter(adminUser, allLeads);
    expect(visible.length).toBe(3);
  });

  it('restricts Agent 1 to only leads assigned to Agent 1', () => {
    const visible = applyLeadRlsFilter(agent1, allLeads);
    expect(visible.length).toBe(1);
    expect(visible[0].full_name).toBe('Lead for Rahul');
  });

  it('restricts Agent 2 to only leads assigned to Agent 2', () => {
    const visible = applyLeadRlsFilter(agent2, allLeads);
    expect(visible.length).toBe(1);
    expect(visible[0].full_name).toBe('Lead for Neha');
  });

  it('prevents Agent 1 from seeing Agent 2 leads', () => {
    const visible = applyLeadRlsFilter(agent1, allLeads);
    const hasAgent2Lead = visible.some((l) => l.assigned_to === 'agent-2');
    expect(hasAgent2Lead).toBe(false);
  });
});
