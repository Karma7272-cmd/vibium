import { supabase } from '@/integrations/supabase/client';
import { Check } from '@/types/check';

export const realCheckService = {
  async getChecks(): Promise<Check[]> {
    const { data, error } = await supabase
      .from('checks')
      .select(`
        *,
        operator:operators(name, npub),
        node:nodes(name, location)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching checks:', error);
      return [];
    }

    return (data || []).map(check => ({
      id: check.id,
      url: check.url,
      operatorNpub: check.operator?.npub || '',
      operatorName: check.operator?.name || 'Unknown',
      nodeId: check.node_id || '',
      nodeName: check.node?.name || 'Unknown',
      timestamp: new Date(check.created_at).toISOString(),
      duration: check.duration || 0,
      statusCode: check.status_code || 0,
      status: check.status as 'success' | 'failed' | 'warning' | 'running',
      location: check.node?.location || '',
      screenshot: check.screenshot_url || '',
      responseTime: check.response_time,
    }));
  },

  async getCheckById(checkId: string): Promise<Check | null> {
    const { data, error } = await supabase
      .from('checks')
      .select(`
        *,
        operator:operators(name, npub),
        node:nodes(name, location)
      `)
      .eq('id', checkId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching check:', error);
      return null;
    }

    return {
      id: data.id,
      url: data.url,
      operatorNpub: data.operator?.npub || '',
      operatorName: data.operator?.name || 'Unknown',
      nodeId: data.node_id || '',
      nodeName: data.node?.name || 'Unknown',
      timestamp: new Date(data.created_at).toISOString(),
      duration: data.duration || 0,
      statusCode: data.status_code || 0,
      status: data.status as 'success' | 'failed' | 'warning' | 'running',
      location: data.node?.location || '',
      screenshot: data.screenshot_url || '',
      responseTime: data.response_time,
    };
  },

  async createCheck(checkData: {
    url: string;
    operator_id?: string;
    node_id?: string;
    status: string;
    status_code?: number;
    duration?: number;
    screenshot_url?: string;
    response_time?: number;
    error_message?: string;
  }) {
    const { data, error } = await supabase
      .from('checks')
      .insert([checkData])
      .select()
      .single();

    if (error) {
      console.error('Error creating check:', error);
      throw error;
    }

    return data;
  },
};
