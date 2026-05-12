// Mock A2UI v0.9 messages simulating a restaurant finder agent stream
// Components and data are interleaved with granular field-by-field updates

import type { A2UIServerMessage } from '@a2ui/vue-core'

const restaurantImages: Record<string, string> = {
  xian: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=260&fit=crop',
  han: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=260&fit=crop',
  redfarm: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400&h=260&fit=crop',
  mott: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=260&fit=crop',
  hwa: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=260&fit=crop',
}

function stars(count: number): string {
  return '★'.repeat(count) + '☆'.repeat(5 - count)
}

// ─── Streaming messages: interleaved component definitions + granular field updates ───
export const restaurantFinderStream: A2UIServerMessage[] = [
  // 1. Create surface
  {
    createSurface: {
      surfaceId: 'restaurant-finder',
      catalogId: 'a2ui.org/standard-catalog/v0.9',
      theme: { primaryColor: '#DC2626', agentDisplayName: 'Restaurant Finder' },
    },
  },
  // 2. Define root + title components
  {
    updateComponents: {
      surfaceId: 'restaurant-finder',
      components: [
        {
          id: 'root',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['title', 'item-list'] },
        },
        {
          id: 'title',
          component: 'Text',
          text: { path: '/title' },
          usageHint: 'h1',
        },
      ],
    },
  },
  // 3. Data: set title
  {
    updateDataModel: {
      surfaceId: 'restaurant-finder',
      value: { title: 'Szechuan Restaurants in New York', items: [] },
    },
  },
  // 4. Define list + card structure
  {
    updateComponents: {
      surfaceId: 'restaurant-finder',
      components: [
        {
          id: 'item-list',
          component: 'List',
          children: {
            template: {
              componentId: 'item-card',
              dataBinding: '/items',
            },
          },
        },
        {
          id: 'item-card',
          component: 'Card',
          child: 'card-row',
        },
        {
          id: 'card-row',
          component: 'Row',
          alignment: 'start',
          children: { explicitList: ['card-img', 'card-info'] },
        },
        {
          id: 'card-img',
          component: 'Image',
          url: { path: 'image' },
          alt: { path: 'name' },
        },
        {
          id: 'card-info',
          component: 'Column',
          alignment: 'start',
          children: {
            explicitList: [
              'card-name',
              'card-rating',
              'card-desc',
              'card-link',
              'card-btn',
            ],
          },
        },
      ],
    },
  },
  // 5. Define card sub-components
  {
    updateComponents: {
      surfaceId: 'restaurant-finder',
      components: [
        {
          id: 'card-name',
          component: 'Text',
          text: { path: 'name' },
          usageHint: 'h3',
        },
        {
          id: 'card-rating',
          component: 'Text',
          text: { path: 'ratingText' },
          usageHint: 'body',
        },
        {
          id: 'card-desc',
          component: 'Text',
          text: { path: 'description' },
          usageHint: 'body',
        },
        {
          id: 'card-link',
          component: 'Text',
          text: { path: 'website' },
          usageHint: 'body',
        },
        {
          id: 'card-btn',
          component: 'Button',
          label: { literalString: 'Book Now' },
          variant: 'primary',
          action: {
            event: {
              name: 'book_restaurant',
              context: {
                restaurantId: { path: 'id' },
                restaurantName: { path: 'name' },
              },
            },
          },
        },
      ],
    },
  },
  // 6. Data: first restaurant - name only
  {
    updateDataModel: {
      surfaceId: 'restaurant-finder',
      value: {
        title: 'Szechuan Restaurants in New York',
        items: [{ id: 'xian', name: "Xi'an Famous Foods" }],
      },
    },
  },
  // 7. Data: first restaurant - add image
  {
    updateDataModel: {
      surfaceId: 'restaurant-finder',
      value: {
        title: 'Szechuan Restaurants in New York',
        items: [{ id: 'xian', name: "Xi'an Famous Foods", image: restaurantImages.xian }],
      },
    },
  },
  // 8. Data: first restaurant - add rating + description
  {
    updateDataModel: {
      surfaceId: 'restaurant-finder',
      value: {
        title: 'Szechuan Restaurants in New York',
        items: [{
          id: 'xian',
          name: "Xi'an Famous Foods",
          ratingText: stars(4),
          description: 'Spicy and savory hand-pulled noodles.',
          image: restaurantImages.xian,
        }],
      },
    },
  },
  // 9. Data: first restaurant - add link + button (full card)
  {
    updateDataModel: {
      surfaceId: 'restaurant-finder',
      value: {
        title: 'Szechuan Restaurants in New York',
        items: [{
          id: 'xian',
          name: "Xi'an Famous Foods",
          ratingText: stars(4),
          description: 'Spicy and savory hand-pulled noodles.',
          website: 'https://www.xianfoods.com/',
          image: restaurantImages.xian,
        }],
      },
    },
  },
  // 10. Data: second restaurant - name + image
  {
    updateDataModel: {
      surfaceId: 'restaurant-finder',
      value: {
        title: 'Szechuan Restaurants in New York',
        items: [
          { id: 'xian', name: "Xi'an Famous Foods", ratingText: stars(4), description: 'Spicy and savory hand-pulled noodles.', website: 'https://www.xianfoods.com/', image: restaurantImages.xian },
          { id: 'han', name: 'Han Dynasty', image: restaurantImages.han },
        ],
      },
    },
  },
  // 11. Data: second restaurant - full
  {
    updateDataModel: {
      surfaceId: 'restaurant-finder',
      value: {
        title: 'Szechuan Restaurants in New York',
        items: [
          { id: 'xian', name: "Xi'an Famous Foods", ratingText: stars(4), description: 'Spicy and savory hand-pulled noodles.', website: 'https://www.xianfoods.com/', image: restaurantImages.xian },
          { id: 'han', name: 'Han Dynasty', ratingText: stars(4), description: 'Authentic Szechuan cuisine.', website: 'https://www.handynasty.net/', image: restaurantImages.han },
        ],
      },
    },
  },
  // 12. Data: third restaurant - full
  {
    updateDataModel: {
      surfaceId: 'restaurant-finder',
      value: {
        title: 'Szechuan Restaurants in New York',
        items: [
          { id: 'xian', name: "Xi'an Famous Foods", ratingText: stars(4), description: 'Spicy and savory hand-pulled noodles.', website: 'https://www.xianfoods.com/', image: restaurantImages.xian },
          { id: 'han', name: 'Han Dynasty', ratingText: stars(4), description: 'Authentic Szechuan cuisine.', website: 'https://www.handynasty.net/', image: restaurantImages.han },
          { id: 'redfarm', name: 'RedFarm', ratingText: stars(4), description: 'Modern Chinese with a creative twist.', website: 'https://www.redfarmnyc.com/', image: restaurantImages.redfarm },
        ],
      },
    },
  },
  // 13. Data: fourth restaurant - full
  {
    updateDataModel: {
      surfaceId: 'restaurant-finder',
      value: {
        title: 'Szechuan Restaurants in New York',
        items: [
          { id: 'xian', name: "Xi'an Famous Foods", ratingText: stars(4), description: 'Spicy and savory hand-pulled noodles.', website: 'https://www.xianfoods.com/', image: restaurantImages.xian },
          { id: 'han', name: 'Han Dynasty', ratingText: stars(4), description: 'Authentic Szechuan cuisine.', website: 'https://www.handynasty.net/', image: restaurantImages.han },
          { id: 'redfarm', name: 'RedFarm', ratingText: stars(4), description: 'Modern Chinese with a creative twist.', website: 'https://www.redfarmnyc.com/', image: restaurantImages.redfarm },
          { id: 'mott', name: 'Mott 32', ratingText: stars(5), description: 'Upscale Cantonese in a vault setting.', website: 'https://mott32.com/newyork/', image: restaurantImages.mott },
        ],
      },
    },
  },
  // 14. Data: all five restaurants
  {
    updateDataModel: {
      surfaceId: 'restaurant-finder',
      value: {
        title: 'Szechuan Restaurants in New York',
        items: [
          { id: 'xian', name: "Xi'an Famous Foods", ratingText: stars(4), description: 'Spicy and savory hand-pulled noodles.', website: 'https://www.xianfoods.com/', image: restaurantImages.xian },
          { id: 'han', name: 'Han Dynasty', ratingText: stars(4), description: 'Authentic Szechuan cuisine.', website: 'https://www.handynasty.net/', image: restaurantImages.han },
          { id: 'redfarm', name: 'RedFarm', ratingText: stars(4), description: 'Modern Chinese with a creative twist.', website: 'https://www.redfarmnyc.com/', image: restaurantImages.redfarm },
          { id: 'mott', name: 'Mott 32', ratingText: stars(5), description: 'Upscale Cantonese in a vault setting.', website: 'https://mott32.com/newyork/', image: restaurantImages.mott },
          { id: 'hwa', name: 'Hwa Yuan Szechuan', ratingText: stars(4), description: 'Classic Szechuan dishes in the East Village.', website: 'https://hwayuannyc.com/', image: restaurantImages.hwa },
        ],
      },
    },
  },
]
