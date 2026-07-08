export interface PlanData {
  name: string;
  price: string;
  data: string;
  dataDescription: string;
  promoBadge?: string;
  inclusions: string[];
}

export const plans: PlanData[] = [
  {
    name: 'All-New GPlan PLUS',
    price: '599',
    data: '10GB',
    dataDescription: '10GB All-access data',
    promoBadge: 'FREE UNLI 5G (6 months)',
    inclusions: [
      'Unli Allnet Calls & Text + Landline',
      'Unlimited 5G access for 6 months',
    ],
  },
  {
    name: 'All-New GPlan PLUS',
    price: '799',
    data: '15GB',
    dataDescription: '15GB Swappable All-access data',
    promoBadge: 'FREE UNLI 5G (12 months)',
    inclusions: [
      'Unli Allnet Calls & Text + Landline',
      'Unlimited 5G access for 12 months',
    ],
  },
  {
    name: 'All-New GPlan PLUS',
    price: '999',
    data: '20GB',
    dataDescription: '20GB Swappable All-access data',
    promoBadge: 'FREE UNLI 5G (12 months)',
    inclusions: [
      'Unli All-net call and text + Unli Landline Calls',
      'Unlimited 5G access for 12 months',
    ],
  },
];
