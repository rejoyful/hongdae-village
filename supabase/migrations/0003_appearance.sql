-- 홍대마을 Phase 5c: 캐릭터 외형 (피부·헤어·상의·하의 조합)
alter table public.profiles add column if not exists appearance jsonb;
