-- Rozšíření plánování na celý rok 2026 (CW32-52)
-- Vytvoříme záznamy pro všechny konstruktéry pro týdny CW32-52 v roce 2026

DO $$
DECLARE
    konstrukter_name TEXT;
    current_cw INTEGER;
    mesic_name TEXT;
BEGIN
    -- Projdeme všechny unikátní konstruktéry
    FOR konstrukter_name IN 
        SELECT DISTINCT konstrukter FROM planning_entries 
    LOOP
        -- Přidáme týdny CW32-52 pro rok 2026
        FOR current_cw IN 32..52 LOOP
            -- Určíme měsíc podle kalendářního týdne
            CASE 
                WHEN current_cw <= 35 THEN mesic_name := 'srpen 2026';
                WHEN current_cw <= 39 THEN mesic_name := 'září 2026';
                WHEN current_cw <= 43 THEN mesic_name := 'říjen 2026';
                WHEN current_cw <= 47 THEN mesic_name := 'listopad 2026';
                ELSE mesic_name := 'prosinec 2026';
            END CASE;

            -- Vložíme záznam pokud ještě neexistuje
            INSERT INTO planning_entries (konstrukter, cw, mesic, mh_tyden, projekt)
            VALUES (
                konstrukter_name,
                'CW' || LPAD(current_cw::TEXT, 2, '0'),
                mesic_name,
                36, -- defaultní hodnota 36 hodin
                CASE WHEN current_cw = 52 THEN 'DOVOLENÁ' ELSE 'FREE' END
            )
            ON CONFLICT (konstrukter, cw) DO NOTHING; -- Pokud už záznam existuje, neděláme nic
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Úspěšně přidány týdny CW32-52 pro rok 2026 pro všechny konstruktéry';
END $$;