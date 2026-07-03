import { NextRequest } from 'next/server';

/**
 * Number-plate lookup — proxies to UK Vehicle Data (the same provider used by
 * scrapacarforcash) so the API key never reaches the browser. Returns a small
 * normalised shape with the details we need plus a vehicle image.
 *
 * Env:
 *   VEHICLE_API_BASE_URL  e.g. https://uk1.ukvehicledata.co.uk/api/datapackage
 *   VEHICLE_API_KEY       your UK Vehicle Data api key
 */
const BASE_URL = process.env.VEHICLE_API_BASE_URL;
const API_KEY = process.env.VEHICLE_API_KEY;

// Node runtime — needs plain server-side fetch, not the edge runtime.
export const runtime = 'nodejs';

interface Dvla {
  Response?: {
    StatusCode?: string;
    StatusMessage?: string;
    DataItems?: {
      VehicleRegistration?: {
        Make?: string;
        Model?: string;
        YearOfManufacture?: string | number;
        Colour?: string;
        FuelType?: string;
      };
      VehicleImages?: {
        ImageDetailsList?: { ImageUrl?: string }[];
      };
    };
  };
}

function bad(message: string, status: number) {
  return Response.json({ message }, { status });
}

export async function POST(request: NextRequest) {
  if (!BASE_URL || !API_KEY) {
    return bad(
      'Vehicle lookup is not configured. Set VEHICLE_API_BASE_URL and VEHICLE_API_KEY.',
      500,
    );
  }

  const body = (await request.json().catch(() => ({}))) as { registration?: string };
  const registration = (body.registration ?? '').toUpperCase().replace(/\s+/g, '');
  if (!registration || registration.length < 2) {
    return bad('Please enter a valid number plate.', 400);
  }

  const q = `v=2&api_nullitems=1&auth_apikey=${API_KEY}&key_VRM=${encodeURIComponent(registration)}`;

  try {
    // Vehicle details
    const detailsRes = await fetch(`${BASE_URL}/VehicleAndMotHistory?${q}`, { cache: 'no-store' });
    const details = (await detailsRes.json().catch(() => ({}))) as Dvla;
    const status = details.Response?.StatusCode;

    if (!detailsRes.ok || status === 'InvalidSearchTerm') {
      return bad(
        "We couldn't find that registration. Please double-check it, or enter your details manually.",
        404,
      );
    }
    if (status !== 'Success') {
      return bad(details.Response?.StatusMessage || 'Vehicle not found.', 404);
    }

    const reg = details.Response?.DataItems?.VehicleRegistration ?? {};

    // Vehicle image (best-effort — a missing image must not fail the lookup)
    let imageUrl: string | null = null;
    try {
      const imageRes = await fetch(`${BASE_URL}/VehicleImageData?${q}`, { cache: 'no-store' });
      const image = (await imageRes.json().catch(() => ({}))) as Dvla;
      imageUrl = image.Response?.DataItems?.VehicleImages?.ImageDetailsList?.[0]?.ImageUrl ?? null;
    } catch {
      imageUrl = null;
    }

    return Response.json({
      registration,
      make: reg.Make ?? '',
      model: reg.Model ?? '',
      year: reg.YearOfManufacture != null ? String(reg.YearOfManufacture) : undefined,
      colour: reg.Colour ?? undefined,
      fuelType: reg.FuelType ?? undefined,
      imageUrl,
    });
  } catch (error) {
    console.error('ERROR in /api/vehicle-data:', error);
    return bad('Server error while fetching vehicle data. Please try again.', 500);
  }
}
