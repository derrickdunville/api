exports.getTestProduct = function(){
  let product = {
      _id: "5a8eac0f5b4e7158a8559d71",
      stripe_plan_id: "plan_diamond_monthly",
      name: "Diamond",
      amount: 99.99,
      description: "Diamond (Monthly)",
      create_date: "2018-02-22T11:39:59.000Z",
      expire_after_interval_amount: 0,
      access_after_last_cycle: "expire access",
      max_number_of_payments: 0,
      limit_payment_cycles: false,
      allow_only_one_trial: false,
      trial_amount: 0,
      trial_duration_days: 0,
      trial_period: false,
      allow_renewals: false,
      access: "expire",
      interval: "month",
      currency: "usd"
    }
  return product
};
