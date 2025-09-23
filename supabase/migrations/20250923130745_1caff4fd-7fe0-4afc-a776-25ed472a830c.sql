-- Fix security warnings from previous migration

-- 1) Fix search_path for trigger function
CREATE OR REPLACE FUNCTION trg_set_updated_at() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- 2) Fix search_path for normalize_slug function  
CREATE OR REPLACE FUNCTION normalize_slug(p_name TEXT)
RETURNS TEXT 
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE 
  s TEXT;
BEGIN
  -- Remove diacritics and normalize (using simple translation)
  s := lower(translate(p_name, 
    'ÁÄĆČĎÉĚËÍÎĹĽŇÓÖŔŘŠŤÚŮÜÝŽáäćčďéěëíîĺľňóöŕřšťúůüýž',
    'AACCDEEEIILLNOORRSTUUUYZaaccdeeeiillnoorrstuuuyz'
  ));
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := trim(both '-' from s);
  RETURN s;
END $$;