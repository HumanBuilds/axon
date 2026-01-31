-- Refactor handle_new_user to use email as default username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Force a schema cache reload by poking a table (standard way to trigger PostgREST reload is NOTIFY or editing a comment)
NOTIFY pgrst, 'reload schema';
COMMENT ON TABLE public.decks IS 'Decks of flashcards';
