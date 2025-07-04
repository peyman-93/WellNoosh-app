import { useState } from 'react';
import { DollarSign, TrendingDown, TrendingUp, ShoppingCart, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function BudgetDashboard() {
  const [weeklyBudget] = useState(85);
  const [spent] = useState(55.75);
  const [remaining] = useState(29.25);
  const spentPercentage = (spent / weeklyBudget) * 100;

  const seasonalDeals = [
    {
      id: 1,
      store: 'Fresh Market',
      item: 'Organic Salmon',
      originalPrice: 18.99,
      salePrice: 12.99,
      savings: 6.00,
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=150&fit=crop',
      expiresIn: '2 days'
    },
    {
      id: 2,
      store: 'Green Grocer',
      item: 'Winter Vegetables Bundle',
      originalPrice: 24.50,
      salePrice: 16.99,
      savings: 7.51,
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=150&fit=crop',
      expiresIn: '1 week'
    },
    {
      id: 3,
      store: 'Whole Foods',
      item: 'Quinoa & Grains Pack',
      originalPrice: 15.75,
      salePrice: 11.25,
      savings: 4.50,
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=150&fit=crop',
      expiresIn: '3 days'
    }
  ];

  const smartSubstitutions = [
    {
      id: 1,
      original: 'Organic Free-Range Chicken',
      originalPrice: 8.99,
      substitute: 'Natural Chicken Breast',
      substitutePrice: 6.49,
      savings: 2.50,
      qualityMatch: 92
    },
    {
      id: 2,
      original: 'Premium Olive Oil',
      originalPrice: 12.99,
      substitute: 'Extra Virgin Olive Oil',
      substitutePrice: 8.99,
      savings: 4.00,
      qualityMatch: 88
    },
    {
      id: 3,
      original: 'Imported Parmesan',
      originalPrice: 15.49,
      substitute: 'Aged Parmesan',
      substitutePrice: 9.99,
      savings: 5.50,
      qualityMatch: 85
    }
  ];

  const weeklyBreakdown = [
    { day: 'Mon', spent: 12.50, budget: 12.14 },
    { day: 'Tue', spent: 8.75, budget: 12.14 },
    { day: 'Wed', spent: 15.25, budget: 12.14 },
    { day: 'Thu', spent: 9.50, budget: 12.14 },
    { day: 'Fri', spent: 9.75, budget: 12.14 },
    { day: 'Sat', spent: 0, budget: 12.14 },
    { day: 'Sun', spent: 0, budget: 12.14 }
  ];

  return (
    <div className="flex flex-col space-y-6 p-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-hero">Budget Intelligence</h1>
          <p className="text-muted-foreground">Smart spending for your family</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-green-600">${remaining.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">remaining this week</div>
        </div>
      </div>

      {/* Budget Overview */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span>Weekly Budget Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Spent: ${spent}</span>
              <span className="text-sm text-muted-foreground">Budget: ${weeklyBudget}</span>
            </div>
            <Progress value={spentPercentage} className="h-3" />
            <div className="flex justify-between items-center">
              <Badge variant={spentPercentage > 80 ? "destructive" : "secondary"}>
                {spentPercentage.toFixed(0)}% used
              </Badge>
              <div className="flex items-center space-x-1 text-green-600">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">$12 under budget</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Breakdown */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>This Week's Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyBreakdown.map((day, index) => (
              <div key={day.day} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 text-sm font-medium">{day.day}</div>
                  <div className="flex-1">
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          day.spent > day.budget ? 'bg-red-500' : 
                          day.spent > 0 ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                        style={{ width: `${Math.min((day.spent / day.budget) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">${day.spent.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">/ ${day.budget.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Deals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-section">Seasonal Deals</h2>
          <Badge className="bg-green-100 text-green-700">Save up to $18</Badge>
        </div>
        <div className="space-y-3">
          {seasonalDeals.map((deal) => (
            <Card key={deal.id} className="shadow-soft overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  <ImageWithFallback
                    src={deal.image}
                    alt={deal.item}
                    className="w-20 h-20 object-cover"
                  />
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-sm">{deal.item}</h3>
                        <p className="text-xs text-muted-foreground">{deal.store}</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Save ${deal.savings.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-green-600">
                            ${deal.salePrice.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            ${deal.originalPrice.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Expires in {deal.expiresIn}</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs">
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Smart Substitutions */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h2 className="text-section">Smart Substitutions</h2>
        </div>
        <div className="space-y-3">
          {smartSubstitutions.map((sub) => (
            <Card key={sub.id} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">{sub.substitute}</span>
                      <Badge variant="outline" className="text-xs">
                        {sub.qualityMatch}% match
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Instead of {sub.original}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      Save ${sub.savings.toFixed(2)}
                    </div>
                    <div className="flex items-center space-x-1 text-xs">
                      <span className="text-green-600">${sub.substitutePrice.toFixed(2)}</span>
                      <span className="text-muted-foreground line-through">
                        ${sub.originalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="w-full bg-gray-100 rounded-full h-1 mr-3">
                    <div 
                      className="h-1 bg-green-500 rounded-full"
                      style={{ width: `${sub.qualityMatch}%` }}
                    ></div>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs whitespace-nowrap">
                    Use This
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Optimization Alert */}
      <Card className="shadow-soft border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-blue-500 text-white">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">AI Budget Optimization</h3>
              <p className="text-sm text-blue-800 mb-3">
                I've analyzed your spending patterns and found 3 ways to save $23 this week while maintaining your nutrition goals.
              </p>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                View Recommendations
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}