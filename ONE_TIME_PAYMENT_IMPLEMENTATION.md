# One-Time Payment with Monthly Tracking Implementation

## Overview

This implementation converts the coaching app from a monthly subscription model to a **one-time payment model with monthly revenue tracking**. This means customers pay the full program cost upfront, but the system calculates and displays monthly revenue based on the program duration.

## How It Works

### **Before (Monthly Subscription)**
- Customer pays $750/month
- Monthly revenue = $750 × number of customers
- Revenue stops when customer cancels

### **After (One-Time Payment)**
- Customer pays $2500 upfront for complete program
- Program duration: 154 days (example)
- Monthly revenue = ($2500 × customers) ÷ (154 days ÷ 30 days)
- Monthly revenue = $5000 ÷ 5.13 months = **$974/month**

## Database Changes

### 1. **New Field Added**
```sql
ALTER TABLE coaching_programs ADD COLUMN duration_days INTEGER DEFAULT 30;
```

### 2. **Updated Schema**
```sql
CREATE TABLE coaching_programs (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coaches(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),           -- Total program cost (e.g., $2500)
  duration_days INTEGER DEFAULT 30, -- Program length in days (e.g., 154)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Updates

### 1. **Programs API** (`/api/coach/[coachId]/programs`)
- Now includes `duration_days` field
- Calculates `monthly_revenue` using one-time payment formula
- Formula: `(price × members_count) ÷ (duration_days ÷ 30)`

### 2. **Coach Stats API** (`/api/coach/[coachId]/stats`)
- Monthly revenue calculation updated to use one-time payment model
- Aggregates monthly revenue across all programs

## Frontend Updates

### 1. **Program Creation Form**
- Added "Duration (days)" field
- Default value: 30 days
- Validation ensures duration > 0

### 2. **Program Display**
- Shows duration in days instead of weeks
- Displays calculated monthly revenue
- Updated program cards with duration information

### 3. **Dashboard Revenue Display**
- Monthly revenue now reflects one-time payment calculations
- More accurate representation of actual revenue flow

## Migration Steps

### 1. **Run Database Migration**
```bash
# Option 1: Run SQL script directly
psql -d your_database -f scripts/add-duration-days-to-programs.sql

# Option 2: Run Node.js script
node scripts/update-program-durations.js
```

### 2. **Update Existing Programs**
The migration script will:
- Add `duration_days` column
- Calculate durations from existing milestone goals
- Set minimum duration for programs without milestones
- Display current program configurations

### 3. **Verify Changes**
Check that:
- All programs have `duration_days` values
- Monthly revenue calculations are correct
- Dashboard displays updated information

## Example Calculations

### **Business Scaling Mastery Program**
```
Program Price: $2500 (one-time)
Program Duration: 154 days
Number of Customers: 2

Total Revenue: $2500 × 2 = $5000
Monthly Revenue: $5000 ÷ (154 ÷ 30) = $5000 ÷ 5.13 = $974
```

### **Multiple Programs**
```
Program 1: $2500, 154 days, 2 customers = $974/month
Program 2: $1500, 90 days, 1 customer = $500/month
Total Monthly Revenue: $974 + $500 = $1474/month
```

## Benefits

### 1. **Accurate Revenue Tracking**
- Reflects actual payment structure
- Shows true monthly cash flow
- Better financial planning

### 2. **Customer Experience**
- Clear total program cost
- No surprise monthly charges
- Better value perception

### 3. **Business Intelligence**
- Realistic revenue projections
- Duration-based performance metrics
- Improved TTV calculations

## Configuration

### **Setting Program Duration**
1. **During Creation**: Set `duration_days` when creating new programs
2. **Manual Update**: Modify existing programs in database
3. **Auto-Calculation**: System calculates from milestone goals

### **Custom Duration Examples**
- **Quick Start**: 30 days
- **Standard Program**: 90 days
- **Comprehensive**: 180 days
- **Mastery Level**: 365 days

## Troubleshooting

### **Common Issues**

1. **Duration Field Missing**
   - Run migration script
   - Check database schema

2. **Incorrect Monthly Revenue**
   - Verify `duration_days` values
   - Check program prices
   - Validate customer counts

3. **Migration Errors**
   - Check database permissions
   - Verify table structure
   - Review error logs

### **Debug Commands**
```sql
-- Check program durations
SELECT id, name, price, duration_days FROM coaching_programs;

-- Verify monthly revenue calculation
SELECT 
  id, 
  name, 
  price, 
  duration_days,
  ROUND((price * 1.0) / (duration_days * 1.0 / 30), 2) as monthly_revenue
FROM coaching_programs;
```

## Future Enhancements

### **Potential Improvements**
1. **Payment Plans**: Installment options within one-time model
2. **Duration Templates**: Predefined program length options
3. **Revenue Forecasting**: Project future monthly revenue
4. **Analytics Dashboard**: Duration-based performance metrics

### **Advanced Features**
1. **Dynamic Pricing**: Adjust prices based on duration
2. **Seasonal Adjustments**: Modify revenue calculations for peak periods
3. **Customer Cohorts**: Track revenue by enrollment date
4. **Churn Analysis**: Monitor completion rates vs. duration

## Conclusion

This implementation provides a more accurate and transparent revenue model for coaching businesses. By tracking one-time payments over time, coaches get better insights into their actual monthly cash flow and can make more informed business decisions.

The system automatically handles all calculations, so coaches can focus on delivering value while maintaining clear visibility into their financial performance.
