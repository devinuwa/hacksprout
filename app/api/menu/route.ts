import { NextResponse } from "next/server";
import { MENU_CATEGORIES, MENU_LAPSES_FIXED, MENU_SOURCE_NOTE } from "@/lib/menu";
import { PROTEINS } from "@/lib/proteins";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/menu
 *
 * The full menu (Veggie Victory, lapses fixed) with each protein-led dish
 * enriched with its protein's functional profile and source from
 * lib/proteins.ts, so the explorer renders data — never copies of it.
 */
export async function GET() {
  const byId = new Map(PROTEINS.map((p) => [p.id, p]));
  const categories = MENU_CATEGORIES.map((cat) => ({
    name: cat.name,
    dishes: cat.dishes.map((dish) => {
      const protein = dish.proteinId ? byId.get(dish.proteinId) : undefined;
      return {
        ...dish,
        functional: protein ? protein.functional : null,
        kitchenMeaning: protein ? protein.kitchenMeaning : null,
        proteinSourceDetail: protein ? protein.source : null,
      };
    }),
  }));
  const dishCount = categories.reduce((s, c) => s + c.dishes.length, 0);
  return NextResponse.json({
    sourceNote: MENU_SOURCE_NOTE,
    lapsesFixed: MENU_LAPSES_FIXED,
    categoryCount: categories.length,
    dishCount,
    categories,
  });
}
