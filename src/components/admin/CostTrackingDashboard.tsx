import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  AlertTriangle,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CostData {
  user_id: string;
  user_email: string;
  company_name: string;
  daily_cost: number;
  weekly_cost: number;
  monthly_cost: number;
  total_requests: number;
}

interface CostThreshold {
  user_id: string;
  daily_threshold: number;
  weekly_threshold: number;
  monthly_threshold: number;
  current_daily_spend: number;
  current_weekly_spend: number;
  current_monthly_spend: number;
  alerts_enabled: boolean;
}

export function CostTrackingDashboard() {
  const [costData, setCostData] = useState<CostData[]>([]);
  const [thresholds, setThresholds] = useState<CostThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const { toast } = useToast();

  useEffect(() => {
    fetchCostData();
    fetchThresholds();
  }, []);

  const fetchCostData = async () => {
    try {
      // Fetch real cost data from ai_cost_tracking table
      const { data: costTrackingData, error: costError } = await supabase
        .from('ai_cost_tracking')
        .select(`
          user_id,
          cost_amount,
          request_timestamp,
          mode_used
        `);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, company_name, contact_person');

      if (costError || profilesError) {
        console.error('Error fetching cost data:', costError || profilesError);
        toast({
          title: "Error",
          description: "Failed to fetch cost data",
          variant: "destructive"
        });
        return;
      }

      // Create a map of user profiles
      const userProfiles = new Map(
        profilesData?.map(profile => [
          profile.user_id, 
          { 
            company_name: profile.company_name || 'Unknown Company',
            contact_person: profile.contact_person || 'Unknown User'
          }
        ]) || []
      );

      // Process the cost data by user
      const userCostMap = new Map<string, CostData>();

      costTrackingData?.forEach(record => {
        const userId = record.user_id;
        const cost = typeof record.cost_amount === 'string' ? parseFloat(record.cost_amount) : record.cost_amount;
        const timestamp = new Date(record.request_timestamp);
        const now = new Date();
        
        // Calculate time periods
        const isToday = timestamp.toDateString() === now.toDateString();
        const isThisWeek = timestamp >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const isThisMonth = timestamp.getMonth() === now.getMonth() && timestamp.getFullYear() === now.getFullYear();

        if (!userCostMap.has(userId)) {
          const profile = userProfiles.get(userId);
          userCostMap.set(userId, {
            user_id: userId,
            user_email: profile?.contact_person || 'Unknown User',
            company_name: profile?.company_name || 'Unknown Company',
            daily_cost: 0,
            weekly_cost: 0,
            monthly_cost: 0,
            total_requests: 0,
          });
        }

        const userData = userCostMap.get(userId)!;
        userData.total_requests += 1;
        
        if (isToday) userData.daily_cost += cost;
        if (isThisWeek) userData.weekly_cost += cost;
        if (isThisMonth) userData.monthly_cost += cost;
      });

      setCostData(Array.from(userCostMap.values()));
    } catch (error) {
      console.error('Error fetching cost data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cost data",
        variant: "destructive"
      });
    }
  };

  const fetchThresholds = async () => {
    try {
      const { data, error } = await supabase
        .from('cost_thresholds')
        .select('*');

      if (error) throw error;
      
      setThresholds(data || []);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateThreshold = async (userId: string, thresholdType: string, value: number) => {
    try {
      const { error } = await supabase
        .from('cost_thresholds')
        .upsert({
          user_id: userId,
          [`${thresholdType}_threshold`]: value,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Threshold updated successfully",
      });
      
      fetchThresholds();
    } catch (error) {
      console.error('Error updating threshold:', error);
      toast({
        title: "Error",
        description: "Failed to update threshold",
        variant: "destructive"
      });
    }
  };

  const getCostByPeriod = (data: CostData) => {
    switch (selectedPeriod) {
      case 'daily': return data.daily_cost;
      case 'weekly': return data.weekly_cost;
      case 'monthly': return data.monthly_cost;
      default: return data.monthly_cost;
    }
  };

  const getThresholdByPeriod = (threshold: CostThreshold) => {
    switch (selectedPeriod) {
      case 'daily': return threshold.daily_threshold;
      case 'weekly': return threshold.weekly_threshold;
      case 'monthly': return threshold.monthly_threshold;
      default: return threshold.monthly_threshold;
    }
  };

  const getCurrentSpendByPeriod = (threshold: CostThreshold) => {
    switch (selectedPeriod) {
      case 'daily': return threshold.current_daily_spend;
      case 'weekly': return threshold.current_weekly_spend;
      case 'monthly': return threshold.current_monthly_spend;
      default: return threshold.current_monthly_spend;
    }
  };

  const totalCost = costData.reduce((sum, data) => sum + getCostByPeriod(data), 0);
  const totalRequests = costData.reduce((sum, data) => sum + data.total_requests, 0);
  const averageCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading cost data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground capitalize">{selectedPeriod}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Request</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageCostPerRequest.toFixed(6)}</div>
            <p className="text-xs text-muted-foreground">Per API call</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costData.length}</div>
            <p className="text-xs text-muted-foreground">With usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Period Selection */}
      <div className="flex gap-2">
        {(['daily', 'weekly', 'monthly'] as const).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Costs</TabsTrigger>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Spenders ({selectedPeriod})</CardTitle>
              <CardDescription>Users with highest costs this period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costData
                  .sort((a, b) => getCostByPeriod(b) - getCostByPeriod(a))
                  .slice(0, 5)
                  .map((user, index) => (
                    <div key={user.user_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.company_name}</p>
                          <p className="text-xs text-muted-foreground">{user.user_email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${getCostByPeriod(user).toFixed(4)}</p>
                        <p className="text-xs text-muted-foreground">{user.total_requests} requests</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Cost Breakdown</CardTitle>
              <CardDescription>Detailed cost information per user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costData.map((user) => {
                  const userThreshold = thresholds.find(t => t.user_id === user.user_id);
                  const currentCost = getCostByPeriod(user);
                  const threshold = userThreshold ? getThresholdByPeriod(userThreshold) : 0;
                  const usage = threshold > 0 ? (currentCost / threshold) * 100 : 0;
                  
                  return (
                    <div key={user.user_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{user.company_name}</h4>
                          <p className="text-sm text-muted-foreground">{user.user_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">${currentCost.toFixed(4)}</p>
                          <p className="text-sm text-muted-foreground">{user.total_requests} requests</p>
                        </div>
                      </div>
                      
                      {userThreshold && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Usage vs Threshold</span>
                            <span>{usage.toFixed(1)}%</span>
                          </div>
                          <Progress value={Math.min(usage, 100)} className="h-2" />
                          {usage >= 80 && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertTriangle className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs text-yellow-600">Approaching threshold</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Thresholds</CardTitle>
              <CardDescription>Manage cost alert thresholds for users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costData.map((user) => {
                  const userThreshold = thresholds.find(t => t.user_id === user.user_id);
                  const currentSpend = userThreshold ? getCurrentSpendByPeriod(userThreshold) : 0;
                  
                  return (
                    <div key={user.user_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h4 className="font-medium">{user.company_name}</h4>
                          <p className="text-sm text-muted-foreground">{user.user_email}</p>
                        </div>
                        <Badge variant={userThreshold?.alerts_enabled ? "default" : "secondary"}>
                          {userThreshold?.alerts_enabled ? "Alerts On" : "Alerts Off"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs">Daily ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={userThreshold?.daily_threshold || 0}
                            onChange={(e) => updateThreshold(user.user_id, 'daily', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Weekly ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={userThreshold?.weekly_threshold || 0}
                            onChange={(e) => updateThreshold(user.user_id, 'weekly', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Monthly ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={userThreshold?.monthly_threshold || 0}
                            onChange={(e) => updateThreshold(user.user_id, 'monthly', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-muted-foreground">
                        Current {selectedPeriod} spend: ${currentSpend.toFixed(4)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}