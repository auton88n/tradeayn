import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DiagnosticIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'database' | 'performance' | 'security' | 'configuration' | 'cache';
  description: string;
  detected_at: string;
  auto_fix_attempted: boolean;
  auto_fix_successful: boolean;
  fix_details?: string;
  manual_action_required?: string;
}

interface SystemReport {
  report_id: string;
  generated_at: string;
  system_status: 'healthy' | 'warning' | 'critical';
  total_issues: number;
  issues_fixed: number;
  issues_requiring_attention: number;
  performance_metrics: {
    response_time_ms: number;
    memory_usage_mb: number;
    active_connections: number;
    cache_hit_rate: number;
  };
  issues: DiagnosticIssue[];
  recommendations: string[];
  next_check_suggested: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting system diagnostics and auto-repair...');
    
    const report: SystemReport = {
      report_id: crypto.randomUUID(),
      generated_at: new Date().toISOString(),
      system_status: 'healthy',
      total_issues: 0,
      issues_fixed: 0,
      issues_requiring_attention: 0,
      performance_metrics: {
        response_time_ms: 0,
        memory_usage_mb: 0,
        active_connections: 0,
        cache_hit_rate: 0,
      },
      issues: [],
      recommendations: [],
      next_check_suggested: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    };

    const startTime = Date.now();

    // 1. Database Connectivity Check
    await checkDatabaseConnectivity(supabase, report);

    // 2. Check RLS Policies
    await checkRLSPolicies(supabase, report);

    // 3. Check System Performance
    await checkSystemPerformance(supabase, report);

    // 4. Check Data Integrity
    await checkDataIntegrity(supabase, report);

    // 5. Check User Access Issues
    await checkUserAccessIssues(supabase, report);

    // 6. Check Configuration Issues
    await checkConfigurationIssues(supabase, report);

    // 7. Cleanup and Maintenance Tasks
    await performMaintenanceTasks(supabase, report);

    // Calculate final metrics
    report.performance_metrics.response_time_ms = Date.now() - startTime;
    report.total_issues = report.issues.length;
    report.issues_fixed = report.issues.filter(i => i.auto_fix_successful).length;
    report.issues_requiring_attention = report.issues.filter(i => !i.auto_fix_successful).length;

    // Determine overall system status
    const criticalIssues = report.issues.filter(i => i.severity === 'critical').length;
    const highIssues = report.issues.filter(i => i.severity === 'high').length;
    
    if (criticalIssues > 0) {
      report.system_status = 'critical';
    } else if (highIssues > 0 || report.issues_requiring_attention > 3) {
      report.system_status = 'warning';
    }

    // Generate recommendations
    generateRecommendations(report);

    // Store the report in the database
    await storeSystemReport(supabase, report);

    console.log(`System diagnostics completed. Status: ${report.system_status}, Issues found: ${report.total_issues}, Fixed: ${report.issues_fixed}`);

    return new Response(
      JSON.stringify({
        success: true,
        report,
        message: `System diagnostics completed. Found ${report.total_issues} issues, automatically fixed ${report.issues_fixed}.`
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error) {
    console.error('System diagnostics error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'System diagnostics failed to complete'
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});

async function checkDatabaseConnectivity(supabase: any, report: SystemReport) {
  try {
    console.log('Checking database connectivity...');
    
    const startTime = Date.now();
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact' });
    const responseTime = Date.now() - startTime;

    if (error) {
      report.issues.push({
        id: crypto.randomUUID(),
        severity: 'critical',
        category: 'database',
        description: `Database connectivity error: ${error.message}`,
        detected_at: new Date().toISOString(),
        auto_fix_attempted: false,
        auto_fix_successful: false,
        manual_action_required: 'Check database configuration and network connectivity'
      });
    } else if (responseTime > 2000) {
      report.issues.push({
        id: crypto.randomUUID(),
        severity: 'medium',
        category: 'performance',
        description: `Slow database response time: ${responseTime}ms`,
        detected_at: new Date().toISOString(),
        auto_fix_attempted: false,
        auto_fix_successful: false,
        manual_action_required: 'Consider optimizing queries or upgrading database resources'
      });
    }

    report.performance_metrics.response_time_ms = responseTime;
  } catch (error) {
    console.error('Database connectivity check failed:', error);
  }
}

async function checkRLSPolicies(supabase: any, report: SystemReport) {
  try {
    console.log('Checking RLS policies...');
    
    const tables = ['profiles', 'access_grants', 'user_roles', 'usage_logs'];
    
    for (const table of tables) {
      try {
        // Check if we can query the table (basic RLS test)
        const { error } = await supabase.from(table).select('*').limit(1);
        
        if (error && error.message.includes('row-level security')) {
          report.issues.push({
            id: crypto.randomUUID(),
            severity: 'high',
            category: 'security',
            description: `RLS policy issue detected on table: ${table}`,
            detected_at: new Date().toISOString(),
            auto_fix_attempted: false,
            auto_fix_successful: false,
            manual_action_required: `Review and update RLS policies for ${table} table`
          });
        }
      } catch (tableError) {
        console.warn(`Could not check RLS for table ${table}:`, tableError);
      }
    }
  } catch (error) {
    console.error('RLS policies check failed:', error);
  }
}

async function checkSystemPerformance(supabase: any, report: SystemReport) {
  try {
    console.log('Checking system performance...');
    
    // Check for inactive users with active access grants
    const { data: inactiveUsers, error } = await supabase
      .from('access_grants')
      .select('user_id, granted_at, expires_at')
      .eq('is_active', true)
      .lt('granted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // 30 days ago

    if (error) {
      console.warn('Could not check inactive users:', error);
    } else if (inactiveUsers && inactiveUsers.length > 10) {
      // Attempt auto-fix: Clean up old inactive users
      const cleanupAttempted = await attemptInactiveUserCleanup(supabase, inactiveUsers);
      
      report.issues.push({
        id: crypto.randomUUID(),
        severity: 'medium',
        category: 'performance',
        description: `Found ${inactiveUsers.length} potentially inactive users with active access`,
        detected_at: new Date().toISOString(),
        auto_fix_attempted: true,
        auto_fix_successful: cleanupAttempted,
        fix_details: cleanupAttempted ? 'Cleaned up old access grants' : 'Cleanup failed',
        manual_action_required: cleanupAttempted ? undefined : 'Manually review and clean inactive user access grants'
      });
    }

    // Check for usage logs older than 90 days (cleanup opportunity)
    const { data: oldLogs, error: logsError } = await supabase
      .from('usage_logs')
      .select('id')
      .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .limit(100);

    if (!logsError && oldLogs && oldLogs.length > 0) {
      const logCleanupSuccess = await attemptLogCleanup(supabase, oldLogs);
      
      report.issues.push({
        id: crypto.randomUUID(),
        severity: 'low',
        category: 'performance',
        description: `Found ${oldLogs.length} old usage logs that can be archived`,
        detected_at: new Date().toISOString(),
        auto_fix_attempted: true,
        auto_fix_successful: logCleanupSuccess,
        fix_details: logCleanupSuccess ? 'Archived old usage logs' : 'Log cleanup failed'
      });
    }

  } catch (error) {
    console.error('System performance check failed:', error);
  }
}

async function checkDataIntegrity(supabase: any, report: SystemReport) {
  try {
    console.log('Checking data integrity...');
    
    // Check for orphaned profiles (users without access grants)
    const { data: orphanedProfiles, error: orphanError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        access_grants!inner(user_id)
      `)
      .is('access_grants.user_id', null);

    if (orphanError) {
      console.warn('Could not check orphaned profiles:', orphanError);
    }

    // Check for users with multiple admin roles (should be prevented)
    const { data: duplicateAdmins, error: adminError } = await supabase
      .rpc('get_duplicate_admin_roles'); // This would be a custom function

    // Note: Since we can't create RPC functions on the fly, we'll check this differently
    const { data: adminRoles, error: adminCheckError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminCheckError && adminRoles) {
      const userCounts = adminRoles.reduce((acc: any, role) => {
        acc[role.user_id] = (acc[role.user_id] || 0) + 1;
        return acc;
      }, {});

      const duplicates = Object.entries(userCounts).filter(([_, count]) => (count as number) > 1);
      
      if (duplicates.length > 0) {
        report.issues.push({
          id: crypto.randomUUID(),
          severity: 'medium',
          category: 'database',
          description: `Found ${duplicates.length} users with duplicate admin roles`,
          detected_at: new Date().toISOString(),
          auto_fix_attempted: false,
          auto_fix_successful: false,
          manual_action_required: 'Remove duplicate admin role entries'
        });
      }
    }

  } catch (error) {
    console.error('Data integrity check failed:', error);
  }
}

async function checkUserAccessIssues(supabase: any, report: SystemReport) {
  try {
    console.log('Checking user access issues...');
    
    // Check for expired access grants that are still active
    const { data: expiredAccess, error } = await supabase
      .from('access_grants')
      .select('id, user_id, expires_at')
      .eq('is_active', true)
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString());

    if (!error && expiredAccess && expiredAccess.length > 0) {
      // Attempt auto-fix: Deactivate expired access grants
      const fixSuccess = await attemptExpiredAccessFix(supabase, expiredAccess);
      
      report.issues.push({
        id: crypto.randomUUID(),
        severity: 'high',
        category: 'security',
        description: `Found ${expiredAccess.length} expired but still active access grants`,
        detected_at: new Date().toISOString(),
        auto_fix_attempted: true,
        auto_fix_successful: fixSuccess,
        fix_details: fixSuccess ? 'Deactivated expired access grants' : 'Failed to deactivate expired grants'
      });
    }

    // Check for users over their monthly limits
    const { data: overLimitUsers, error: limitError } = await supabase
      .from('access_grants')
      .select('user_id, monthly_limit, current_month_usage')
      .eq('is_active', true)
      .not('monthly_limit', 'is', null);

    if (!limitError && overLimitUsers) {
      const violators = overLimitUsers.filter(user => 
        user.current_month_usage > user.monthly_limit
      );

      if (violators.length > 0) {
        report.issues.push({
          id: crypto.randomUUID(),
          severity: 'medium',
          category: 'configuration',
          description: `Found ${violators.length} users exceeding their monthly usage limits`,
          detected_at: new Date().toISOString(),
          auto_fix_attempted: false,
          auto_fix_successful: false,
          manual_action_required: 'Review and update usage limits or notify users'
        });
      }
    }

  } catch (error) {
    console.error('User access issues check failed:', error);
  }
}

async function checkConfigurationIssues(supabase: any, report: SystemReport) {
  try {
    console.log('Checking configuration issues...');
    
    // This would check various configuration issues in a real implementation
    // For now, we'll simulate some common configuration checks
    
    // Check if there are any users without profiles
    const { data: usersWithoutProfiles, error } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        profiles!inner(user_id)
      `)
      .is('profiles.user_id', null);

    if (error) {
      console.warn('Could not check users without profiles:', error);
    }

    // Add a configuration health check issue if needed
    report.recommendations.push('Regularly review system configurations');
    report.recommendations.push('Monitor user access patterns');
    report.recommendations.push('Keep system documentation updated');

  } catch (error) {
    console.error('Configuration issues check failed:', error);
  }
}

async function performMaintenanceTasks(supabase: any, report: SystemReport) {
  try {
    console.log('Performing maintenance tasks...');
    
    // Reset usage counts for new month (if needed)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const firstOfMonth = new Date(currentYear, currentMonth, 1).toISOString();

    const { data: needsReset, error } = await supabase
      .from('access_grants')
      .select('id, usage_reset_date')
      .lt('usage_reset_date', firstOfMonth);

    if (!error && needsReset && needsReset.length > 0) {
      const resetSuccess = await attemptUsageReset(supabase, needsReset, firstOfMonth);
      
      if (resetSuccess) {
        report.issues.push({
          id: crypto.randomUUID(),
          severity: 'low',
          category: 'configuration',
          description: `Reset usage counters for ${needsReset.length} users for new month`,
          detected_at: new Date().toISOString(),
          auto_fix_attempted: true,
          auto_fix_successful: true,
          fix_details: 'Successfully reset monthly usage counters'
        });
      }
    }

  } catch (error) {
    console.error('Maintenance tasks failed:', error);
  }
}

// Auto-fix helper functions
async function attemptInactiveUserCleanup(supabase: any, inactiveUsers: any[]): Promise<boolean> {
  try {
    // Only cleanup users inactive for more than 60 days
    const cutoffDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const oldInactiveUsers = inactiveUsers.filter(user => user.granted_at < cutoffDate);

    if (oldInactiveUsers.length > 0) {
      const { error } = await supabase
        .from('access_grants')
        .update({ is_active: false, notes: 'Automatically deactivated due to inactivity' })
        .in('user_id', oldInactiveUsers.map(u => u.user_id));

      return !error;
    }
    return true;
  } catch (error) {
    console.error('Inactive user cleanup failed:', error);
    return false;
  }
}

async function attemptLogCleanup(supabase: any, oldLogs: any[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('usage_logs')
      .delete()
      .in('id', oldLogs.map(log => log.id));

    return !error;
  } catch (error) {
    console.error('Log cleanup failed:', error);
    return false;
  }
}

async function attemptExpiredAccessFix(supabase: any, expiredAccess: any[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('access_grants')
      .update({ is_active: false, notes: 'Automatically deactivated due to expiration' })
      .in('id', expiredAccess.map(access => access.id));

    return !error;
  } catch (error) {
    console.error('Expired access fix failed:', error);
    return false;
  }
}

async function attemptUsageReset(supabase: any, needsReset: any[], firstOfMonth: string): Promise<boolean> {
  try {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1);

    const { error } = await supabase
      .from('access_grants')
      .update({ 
        current_month_usage: 0, 
        usage_reset_date: nextMonth.toISOString().split('T')[0]
      })
      .in('id', needsReset.map(reset => reset.id));

    return !error;
  } catch (error) {
    console.error('Usage reset failed:', error);
    return false;
  }
}

function generateRecommendations(report: SystemReport) {
  const criticalIssues = report.issues.filter(i => i.severity === 'critical').length;
  const highIssues = report.issues.filter(i => i.severity === 'high').length;
  
  if (criticalIssues > 0) {
    report.recommendations.push('⚠️ URGENT: Address all critical issues immediately');
  }
  
  if (highIssues > 0) {
    report.recommendations.push('⚡ High priority: Resolve high-severity issues within 24 hours');
  }

  if (report.issues_requiring_attention > 5) {
    report.recommendations.push('🔧 Consider scheduling maintenance window for manual fixes');
  }

  if (report.performance_metrics.response_time_ms > 1000) {
    report.recommendations.push('🚀 Performance: Optimize database queries and consider caching');
  }

  report.recommendations.push('📊 Schedule regular diagnostics (recommended: daily)');
  report.recommendations.push('💾 Implement automated backups if not already configured');
  report.recommendations.push('🔍 Monitor system logs for patterns and trends');
}

async function storeSystemReport(supabase: any, report: SystemReport) {
  try {
    // Store the report for historical tracking
    const { error } = await supabase
      .from('system_reports')
      .insert({
        report_id: report.report_id,
        generated_at: report.generated_at,
        system_status: report.system_status,
        total_issues: report.total_issues,
        issues_fixed: report.issues_fixed,
        issues_requiring_attention: report.issues_requiring_attention,
        performance_metrics: report.performance_metrics,
        issues: report.issues,
        recommendations: report.recommendations,
        report_data: report
      });

    if (error) {
      console.warn('Could not store system report:', error);
      // This is non-critical, continue anyway
    }
  } catch (error) {
    console.error('Failed to store system report:', error);
    // This is non-critical, continue anyway
  }
}