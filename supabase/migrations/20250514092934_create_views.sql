-- Create a view to calculate total pickups per user per month
CREATE OR REPLACE VIEW public.user_monthly_pickups WITH (security_invoker = on) AS
SELECT 
  p.user_id,
  p.month_id,
  m.year,
  m.month,
  SUM(p.quantity) AS total_quantity,
  prof.quota,
  CASE WHEN SUM(p.quantity) >= prof.quota THEN TRUE ELSE FALSE END AS is_completed
FROM 
  "pickups" p
JOIN 
  "months" m ON p.month_id = m.id
JOIN 
  "profiles" prof ON p.user_id = prof.id
GROUP BY 
  p.user_id, p.month_id, m.year, m.month, prof.quota;
