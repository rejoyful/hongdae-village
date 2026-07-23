import type { SupabaseClient } from '@supabase/supabase-js';
import {
  isHomeGuestbookStickerKind, type HomeGuestbookRecord, type HomeGuestbookStickerKind,
} from '../game/social/homeGuestbook';

export type LeaveHomeGuestbookResult = 'ok' | 'today' | 'closed' | 'self' | 'bad' | 'offline';

export async function leaveHomeGuestbook(
  sb: SupabaseClient, roomId: number, kind: HomeGuestbookStickerKind,
): Promise<LeaveHomeGuestbookResult> {
  if (!Number.isInteger(roomId) || roomId <= 0 || !isHomeGuestbookStickerKind(kind)) return 'bad';
  const { data, error } = await sb.rpc('leave_home_guestbook', { p_room_id: roomId, p_sticker: kind });
  if (error) return 'offline';
  return ['ok', 'today', 'closed', 'self', 'bad'].includes(data as string) ? data as LeaveHomeGuestbookResult : 'bad';
}

export async function fetchHomeGuestbook(sb: SupabaseClient, roomId: number): Promise<HomeGuestbookRecord[]> {
  if (!Number.isInteger(roomId) || roomId <= 0) return [];
  const { data, error } = await sb.from('home_guestbook')
    .select('id,room_id,from_user_id,sticker,visit_day,created_at')
    .eq('room_id', roomId).order('created_at', { ascending: false }).limit(60);
  if (error || !data) return [];
  const userIds = [...new Set(data.map((row) => row.from_user_id as string))];
  const names = new Map<string, string>();
  if (userIds.length) {
    const profiles = await sb.from('profiles').select('id,nickname').in('id', userIds);
    for (const profile of profiles.data ?? []) names.set(profile.id as string, typeof profile.nickname === 'string' ? profile.nickname : '이름 없는 이웃');
  }
  return data.flatMap((row) => {
    if (!isHomeGuestbookStickerKind(row.sticker)) return [];
    const fromUserId = row.from_user_id as string;
    return [{
      id: Number(row.id), roomId: Number(row.room_id), fromUserId,
      fromNickname: (names.get(fromUserId) ?? '이름 없는 이웃').replace(/[<>\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12) || '이름 없는 이웃',
      kind: row.sticker, day: String(row.visit_day), createdAt: String(row.created_at),
    }];
  });
}
