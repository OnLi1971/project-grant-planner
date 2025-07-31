import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar } from 'lucide-react';

// Reálná data z PlanningEditor (zkrácená verze pro FREE kapacity)
const realPlanningData: { [key: string]: { cw: string; projekt: string }[] } = {
  'Hlavan Martin': [
    { cw: 'CW32', projekt: 'ST_BLAVA' }, { cw: 'CW33', projekt: 'ST_BLAVA' }, { cw: 'CW34', projekt: 'ST_BLAVA' }, { cw: 'CW35', projekt: 'ST_BLAVA' },
    { cw: 'CW36', projekt: 'ST_BLAVA' }, { cw: 'CW37', projekt: 'ST_BLAVA' }, { cw: 'CW38', projekt: 'ST_BLAVA' }, { cw: 'CW39', projekt: 'ST_BLAVA' },
    { cw: 'CW40', projekt: 'ST_BLAVA' }, { cw: 'CW41', projekt: 'ST_BLAVA' }, { cw: 'CW42', projekt: 'ST_BLAVA' }, { cw: 'CW43', projekt: 'ST_BLAVA' },
    { cw: 'CW44', projekt: 'ST_BLAVA' }, { cw: 'CW45', projekt: 'ST_MAINZ' }, { cw: 'CW46', projekt: 'ST_MAINZ' }, { cw: 'CW47', projekt: 'ST_MAINZ' },
    { cw: 'CW48', projekt: 'ST_MAINZ' }, { cw: 'CW49', projekt: 'ST_MAINZ' }, { cw: 'CW50', projekt: 'ST_MAINZ' }, { cw: 'CW51', projekt: 'ST_MAINZ' }, { cw: 'CW52', projekt: 'ST_MAINZ' }
  ],
  'Fica Ladislav': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'ST_MAINZ' }, { cw: 'CW35', projekt: 'ST_MAINZ' },
    { cw: 'CW36', projekt: 'ST_MAINZ' }, { cw: 'CW37', projekt: 'ST_MAINZ' }, { cw: 'CW38', projekt: 'ST_MAINZ' }, { cw: 'CW39', projekt: 'ST_MAINZ' },
    { cw: 'CW40', projekt: 'ST_MAINZ' }, { cw: 'CW41', projekt: 'ST_MAINZ' }, { cw: 'CW42', projekt: 'ST_MAINZ' }, { cw: 'CW43', projekt: 'ST_MAINZ' },
    { cw: 'CW44', projekt: 'ST_MAINZ' }, { cw: 'CW45', projekt: 'ST_MAINZ' }, { cw: 'CW46', projekt: 'ST_MAINZ' }, { cw: 'CW47', projekt: 'ST_MAINZ' },
    { cw: 'CW48', projekt: 'ST_MAINZ' }, { cw: 'CW49', projekt: 'ST_MAINZ' }, { cw: 'CW50', projekt: 'ST_MAINZ' }, { cw: 'CW51', projekt: 'ST_MAINZ' }, { cw: 'CW52', projekt: 'ST_MAINZ' }
  ],
  'Ambrož David': [
    { cw: 'CW32', projekt: 'DOVOLENÁ' }, { cw: 'CW33', projekt: 'ST_BLAVA' }, { cw: 'CW34', projekt: 'DOVOLENÁ' }, { cw: 'CW35', projekt: 'DOVOLENÁ' },
    { cw: 'CW36', projekt: 'ST_MAINZ' }, { cw: 'CW37', projekt: 'ST_MAINZ' }, { cw: 'CW38', projekt: 'ST_MAINZ' }, { cw: 'CW39', projekt: 'ST_MAINZ' },
    { cw: 'CW40', projekt: 'ST_MAINZ' }, { cw: 'CW41', projekt: 'ST_MAINZ' }, { cw: 'CW42', projekt: 'ST_MAINZ' }, { cw: 'CW43', projekt: 'ST_MAINZ' },
    { cw: 'CW44', projekt: 'ST_MAINZ' }, { cw: 'CW45', projekt: 'ST_MAINZ' }, { cw: 'CW46', projekt: 'ST_MAINZ' }, { cw: 'CW47', projekt: 'ST_MAINZ' },
    { cw: 'CW48', projekt: 'ST_MAINZ' }, { cw: 'CW49', projekt: 'ST_MAINZ' }, { cw: 'CW50', projekt: 'ST_MAINZ' }, { cw: 'CW51', projekt: 'ST_MAINZ' }, { cw: 'CW52', projekt: 'ST_MAINZ' }
  ],
  'Slavík Ondřej': [
    { cw: 'CW32', projekt: 'ST_EMU_INT' }, { cw: 'CW33', projekt: 'ST_EMU_INT' }, { cw: 'CW34', projekt: 'ST_EMU_INT' }, { cw: 'CW35', projekt: 'ST_EMU_INT' },
    { cw: 'CW36', projekt: 'ST_EMU_INT' }, { cw: 'CW37', projekt: 'ST_EMU_INT' }, { cw: 'CW38', projekt: 'ST_EMU_INT' }, { cw: 'CW39', projekt: 'ST_EMU_INT' },
    { cw: 'CW40', projekt: 'ST_EMU_INT' }, { cw: 'CW41', projekt: 'ST_EMU_INT' }, { cw: 'CW42', projekt: 'ST_EMU_INT' }, { cw: 'CW43', projekt: 'ST_EMU_INT' },
    { cw: 'CW44', projekt: 'ST_EMU_INT' }, { cw: 'CW45', projekt: 'ST_EMU_INT' }, { cw: 'CW46', projekt: 'ST_EMU_INT' }, { cw: 'CW47', projekt: 'ST_EMU_INT' },
    { cw: 'CW48', projekt: 'ST_EMU_INT' }, { cw: 'CW49', projekt: 'ST_EMU_INT' }, { cw: 'CW50', projekt: 'ST_EMU_INT' }, { cw: 'CW51', projekt: 'ST_EMU_INT' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Chrenko Peter': [
    { cw: 'CW32', projekt: 'ST_EMU_INT' }, { cw: 'CW33', projekt: 'ST_EMU_INT' }, { cw: 'CW34', projekt: 'ST_EMU_INT' }, { cw: 'CW35', projekt: 'ST_EMU_INT' },
    { cw: 'CW36', projekt: 'ST_EMU_INT' }, { cw: 'CW37', projekt: 'ST_EMU_INT' }, { cw: 'CW38', projekt: 'ST_EMU_INT' }, { cw: 'CW39', projekt: 'ST_EMU_INT' },
    { cw: 'CW40', projekt: 'ST_EMU_INT' }, { cw: 'CW41', projekt: 'ST_EMU_INT' }, { cw: 'CW42', projekt: 'ST_EMU_INT' }, { cw: 'CW43', projekt: 'ST_EMU_INT' },
    { cw: 'CW44', projekt: 'ST_EMU_INT' }, { cw: 'CW45', projekt: 'ST_EMU_INT' }, { cw: 'CW46', projekt: 'ST_EMU_INT' }, { cw: 'CW47', projekt: 'ST_EMU_INT' },
    { cw: 'CW48', projekt: 'ST_EMU_INT' }, { cw: 'CW49', projekt: 'ST_EMU_INT' }, { cw: 'CW50', projekt: 'ST_EMU_INT' }, { cw: 'CW51', projekt: 'ST_EMU_INT' }, { cw: 'CW52', projekt: 'ST_EMU_INT' }
  ],
  'Jurčišin Peter': [
    { cw: 'CW32', projekt: 'ST_EMU_INT' }, { cw: 'CW33', projekt: 'ST_EMU_INT' }, { cw: 'CW34', projekt: 'ST_EMU_INT' }, { cw: 'CW35', projekt: 'ST_EMU_INT' },
    { cw: 'CW36', projekt: 'ST_EMU_INT' }, { cw: 'CW37', projekt: 'ST_EMU_INT' }, { cw: 'CW38', projekt: 'ST_EMU_INT' }, { cw: 'CW39', projekt: 'ST_EMU_INT' },
    { cw: 'CW40', projekt: 'ST_EMU_INT' }, { cw: 'CW41', projekt: 'ST_EMU_INT' }, { cw: 'CW42', projekt: 'ST_EMU_INT' }, { cw: 'CW43', projekt: 'ST_EMU_INT' },
    { cw: 'CW44', projekt: 'ST_EMU_INT' }, { cw: 'CW45', projekt: 'ST_EMU_INT' }, { cw: 'CW46', projekt: 'ST_EMU_INT' }, { cw: 'CW47', projekt: 'ST_EMU_INT' },
    { cw: 'CW48', projekt: 'ST_EMU_INT' }, { cw: 'CW49', projekt: 'ST_EMU_INT' }, { cw: 'CW50', projekt: 'ST_EMU_INT' }, { cw: 'CW51', projekt: 'ST_EMU_INT' }, { cw: 'CW52', projekt: 'ST_EMU_INT' }
  ],
  'Púpava Marián': [
    { cw: 'CW32', projekt: 'ST_EMU_INT' }, { cw: 'CW33', projekt: 'ST_EMU_INT' }, { cw: 'CW34', projekt: 'ST_EMU_INT' }, { cw: 'CW35', projekt: 'ST_EMU_INT' },
    { cw: 'CW36', projekt: 'ST_EMU_INT' }, { cw: 'CW37', projekt: 'ST_EMU_INT' }, { cw: 'CW38', projekt: 'ST_EMU_INT' }, { cw: 'CW39', projekt: 'ST_EMU_INT' },
    { cw: 'CW40', projekt: 'ST_EMU_INT' }, { cw: 'CW41', projekt: 'ST_EMU_INT' }, { cw: 'CW42', projekt: 'ST_EMU_INT' }, { cw: 'CW43', projekt: 'ST_EMU_INT' },
    { cw: 'CW44', projekt: 'ST_EMU_INT' }, { cw: 'CW45', projekt: 'ST_EMU_INT' }, { cw: 'CW46', projekt: 'ST_EMU_INT' }, { cw: 'CW47', projekt: 'ST_EMU_INT' },
    { cw: 'CW48', projekt: 'ST_EMU_INT' }, { cw: 'CW49', projekt: 'ST_EMU_INT' }, { cw: 'CW50', projekt: 'ST_EMU_INT' }, { cw: 'CW51', projekt: 'ST_EMU_INT' }, { cw: 'CW52', projekt: 'ST_EMU_INT' }
  ],
  'Bohušík Martin': [
    { cw: 'CW32', projekt: 'ST_EMU_INT' }, { cw: 'CW33', projekt: 'ST_EMU_INT' }, { cw: 'CW34', projekt: 'ST_EMU_INT' }, { cw: 'CW35', projekt: 'ST_EMU_INT' },
    { cw: 'CW36', projekt: 'ST_EMU_INT' }, { cw: 'CW37', projekt: 'ST_EMU_INT' }, { cw: 'CW38', projekt: 'ST_EMU_INT' }, { cw: 'CW39', projekt: 'ST_EMU_INT' },
    { cw: 'CW40', projekt: 'ST_EMU_INT' }, { cw: 'CW41', projekt: 'ST_EMU_INT' }, { cw: 'CW42', projekt: 'ST_EMU_INT' }, { cw: 'CW43', projekt: 'ST_EMU_INT' },
    { cw: 'CW44', projekt: 'ST_EMU_INT' }, { cw: 'CW45', projekt: 'ST_EMU_INT' }, { cw: 'CW46', projekt: 'ST_EMU_INT' }, { cw: 'CW47', projekt: 'ST_EMU_INT' },
    { cw: 'CW48', projekt: 'ST_EMU_INT' }, { cw: 'CW49', projekt: 'ST_EMU_INT' }, { cw: 'CW50', projekt: 'ST_EMU_INT' }, { cw: 'CW51', projekt: 'ST_EMU_INT' }, { cw: 'CW52', projekt: 'ST_EMU_INT' }
  ],
  'Uher Tomáš': [
    { cw: 'CW32', projekt: 'ST_EMU_INT' }, { cw: 'CW33', projekt: 'ST_EMU_INT' }, { cw: 'CW34', projekt: 'ST_EMU_INT' }, { cw: 'CW35', projekt: 'ST_EMU_INT' },
    { cw: 'CW36', projekt: 'ST_EMU_INT' }, { cw: 'CW37', projekt: 'ST_EMU_INT' }, { cw: 'CW38', projekt: 'ST_EMU_INT' }, { cw: 'CW39', projekt: 'ST_EMU_INT' },
    { cw: 'CW40', projekt: 'ST_EMU_INT' }, { cw: 'CW41', projekt: 'ST_EMU_INT' }, { cw: 'CW42', projekt: 'ST_EMU_INT' }, { cw: 'CW43', projekt: 'ST_EMU_INT' },
    { cw: 'CW44', projekt: 'ST_EMU_INT' }, { cw: 'CW45', projekt: 'ST_EMU_INT' }, { cw: 'CW46', projekt: 'ST_EMU_INT' }, { cw: 'CW47', projekt: 'ST_EMU_INT' },
    { cw: 'CW48', projekt: 'ST_EMU_INT' }, { cw: 'CW49', projekt: 'ST_EMU_INT' }, { cw: 'CW50', projekt: 'ST_EMU_INT' }, { cw: 'CW51', projekt: 'ST_EMU_INT' }, { cw: 'CW52', projekt: 'ST_EMU_INT' }
  ],
  'Weiss Ondřej': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'FREE' }, { cw: 'CW35', projekt: 'FREE' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Borský Jan': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'FREE' }, { cw: 'CW35', projekt: 'FREE' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Pytela Martin': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'FREE' }, { cw: 'CW35', projekt: 'FREE' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Litvinov Evgenii': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'FREE' }, { cw: 'CW35', projekt: 'FREE' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Jandečka Karel': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'FREE' }, { cw: 'CW35', projekt: 'FREE' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Heřman Daniel': [
    { cw: 'CW32', projekt: 'ST_EMU_INT' }, { cw: 'CW33', projekt: 'ST_EMU_INT' }, { cw: 'CW34', projekt: 'ST_EMU_INT' }, { cw: 'CW35', projekt: 'ST_EMU_INT' },
    { cw: 'CW36', projekt: 'ST_EMU_INT' }, { cw: 'CW37', projekt: 'ST_EMU_INT' }, { cw: 'CW38', projekt: 'ST_EMU_INT' }, { cw: 'CW39', projekt: 'ST_EMU_INT' },
    { cw: 'CW40', projekt: 'ST_EMU_INT' }, { cw: 'CW41', projekt: 'ST_EMU_INT' }, { cw: 'CW42', projekt: 'ST_EMU_INT' }, { cw: 'CW43', projekt: 'ST_EMU_INT' },
    { cw: 'CW44', projekt: 'ST_EMU_INT' }, { cw: 'CW45', projekt: 'ST_EMU_INT' }, { cw: 'CW46', projekt: 'ST_EMU_INT' }, { cw: 'CW47', projekt: 'ST_EMU_INT' },
    { cw: 'CW48', projekt: 'ST_EMU_INT' }, { cw: 'CW49', projekt: 'ST_EMU_INT' }, { cw: 'CW50', projekt: 'ST_EMU_INT' }, { cw: 'CW51', projekt: 'ST_EMU_INT' }, { cw: 'CW52', projekt: 'ST_EMU_INT' }
  ],
  'Karlesz Michal': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'ST_MAINZ' }, { cw: 'CW35', projekt: 'ST_MAINZ' },
    { cw: 'CW36', projekt: 'ST_MAINZ' }, { cw: 'CW37', projekt: 'ST_MAINZ' }, { cw: 'CW38', projekt: 'ST_MAINZ' }, { cw: 'CW39', projekt: 'ST_MAINZ' },
    { cw: 'CW40', projekt: 'ST_MAINZ' }, { cw: 'CW41', projekt: 'ST_MAINZ' }, { cw: 'CW42', projekt: 'ST_MAINZ' }, { cw: 'CW43', projekt: 'ST_MAINZ' },
    { cw: 'CW44', projekt: 'ST_MAINZ' }, { cw: 'CW45', projekt: 'ST_MAINZ' }, { cw: 'CW46', projekt: 'ST_MAINZ' }, { cw: 'CW47', projekt: 'ST_MAINZ' },
    { cw: 'CW48', projekt: 'ST_MAINZ' }, { cw: 'CW49', projekt: 'ST_MAINZ' }, { cw: 'CW50', projekt: 'ST_MAINZ' }, { cw: 'CW51', projekt: 'ST_MAINZ' }, { cw: 'CW52', projekt: 'ST_MAINZ' }
  ],
  'Matta Jozef': [
    { cw: 'CW32', projekt: 'ST_BLAVA' }, { cw: 'CW33', projekt: 'ST_BLAVA' }, { cw: 'CW34', projekt: 'DOVOLENÁ' }, { cw: 'CW35', projekt: 'ST_MAINZ' },
    { cw: 'CW36', projekt: 'ST_MAINZ' }, { cw: 'CW37', projekt: 'ST_MAINZ' }, { cw: 'CW38', projekt: 'ST_MAINZ' }, { cw: 'CW39', projekt: 'ST_MAINZ' },
    { cw: 'CW40', projekt: 'ST_MAINZ' }, { cw: 'CW41', projekt: 'ST_MAINZ' }, { cw: 'CW42', projekt: 'ST_MAINZ' }, { cw: 'CW43', projekt: 'ST_MAINZ' },
    { cw: 'CW44', projekt: 'ST_MAINZ' }, { cw: 'CW45', projekt: 'ST_MAINZ' }, { cw: 'CW46', projekt: 'ST_MAINZ' }, { cw: 'CW47', projekt: 'ST_MAINZ' },
    { cw: 'CW48', projekt: 'ST_MAINZ' }, { cw: 'CW49', projekt: 'ST_MAINZ' }, { cw: 'CW50', projekt: 'ST_MAINZ' }, { cw: 'CW51', projekt: 'ST_MAINZ' }, { cw: 'CW52', projekt: 'ST_MAINZ' }
  ],
  'Pecinovský Pavel': [
    { cw: 'CW32', projekt: 'ST_EMU_INT' }, { cw: 'CW33', projekt: 'ST_EMU_INT' }, { cw: 'CW34', projekt: 'ST_EMU_INT' }, { cw: 'CW35', projekt: 'ST_EMU_INT' },
    { cw: 'CW36', projekt: 'ST_EMU_INT' }, { cw: 'CW37', projekt: 'ST_EMU_INT' }, { cw: 'CW38', projekt: 'ST_EMU_INT' }, { cw: 'CW39', projekt: 'ST_EMU_INT' },
    { cw: 'CW40', projekt: 'ST_EMU_INT' }, { cw: 'CW41', projekt: 'ST_EMU_INT' }, { cw: 'CW42', projekt: 'ST_EMU_INT' }, { cw: 'CW43', projekt: 'ST_EMU_INT' },
    { cw: 'CW44', projekt: 'ST_EMU_INT' }, { cw: 'CW45', projekt: 'ST_EMU_INT' }, { cw: 'CW46', projekt: 'ST_EMU_INT' }, { cw: 'CW47', projekt: 'ST_EMU_INT' },
    { cw: 'CW48', projekt: 'ST_EMU_INT' }, { cw: 'CW49', projekt: 'ST_EMU_INT' }, { cw: 'CW50', projekt: 'ST_EMU_INT' }, { cw: 'CW51', projekt: 'ST_EMU_INT' }, { cw: 'CW52', projekt: 'ST_EMU_INT' }
  ],
  'Anovčín Branislav': [
    { cw: 'CW32', projekt: 'ST_BLAVA' }, { cw: 'CW33', projekt: 'ST_BLAVA' }, { cw: 'CW34', projekt: 'ST_BLAVA' }, { cw: 'CW35', projekt: 'ST_BLAVA' },
    { cw: 'CW36', projekt: 'ST_MAINZ' }, { cw: 'CW37', projekt: 'ST_MAINZ' }, { cw: 'CW38', projekt: 'ST_MAINZ' }, { cw: 'CW39', projekt: 'ST_MAINZ' },
    { cw: 'CW40', projekt: 'ST_MAINZ' }, { cw: 'CW41', projekt: 'ST_MAINZ' }, { cw: 'CW42', projekt: 'ST_MAINZ' }, { cw: 'CW43', projekt: 'ST_MAINZ' },
    { cw: 'CW44', projekt: 'ST_MAINZ' }, { cw: 'CW45', projekt: 'ST_MAINZ' }, { cw: 'CW46', projekt: 'ST_MAINZ' }, { cw: 'CW47', projekt: 'ST_MAINZ' },
    { cw: 'CW48', projekt: 'ST_MAINZ' }, { cw: 'CW49', projekt: 'ST_MAINZ' }, { cw: 'CW50', projekt: 'ST_MAINZ' }, { cw: 'CW51', projekt: 'ST_MAINZ' }, { cw: 'CW52', projekt: 'ST_MAINZ' }
  ],
  'Bartovič Anton': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'FREE' }, { cw: 'CW35', projekt: 'FREE' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Břicháček Miloš': [
    { cw: 'CW32', projekt: 'ST_BLAVA' }, { cw: 'CW33', projekt: 'ST_BLAVA' }, { cw: 'CW34', projekt: 'ST_BLAVA' }, { cw: 'CW35', projekt: 'ST_BLAVA' },
    { cw: 'CW36', projekt: 'ST_MAINZ' }, { cw: 'CW37', projekt: 'ST_MAINZ' }, { cw: 'CW38', projekt: 'ST_MAINZ' }, { cw: 'CW39', projekt: 'ST_MAINZ' },
    { cw: 'CW40', projekt: 'ST_MAINZ' }, { cw: 'CW41', projekt: 'ST_MAINZ' }, { cw: 'CW42', projekt: 'ST_MAINZ' }, { cw: 'CW43', projekt: 'ST_MAINZ' },
    { cw: 'CW44', projekt: 'ST_MAINZ' }, { cw: 'CW45', projekt: 'ST_MAINZ' }, { cw: 'CW46', projekt: 'ST_MAINZ' }, { cw: 'CW47', projekt: 'ST_MAINZ' },
    { cw: 'CW48', projekt: 'ST_MAINZ' }, { cw: 'CW49', projekt: 'ST_MAINZ' }, { cw: 'CW50', projekt: 'ST_MAINZ' }, { cw: 'CW51', projekt: 'ST_MAINZ' }, { cw: 'CW52', projekt: 'ST_MAINZ' }
  ],
  'Fenyk Pavel': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'FREE' }, { cw: 'CW35', projekt: 'FREE' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'ST_MAINZ' }, { cw: 'CW46', projekt: 'ST_MAINZ' }, { cw: 'CW47', projekt: 'ST_MAINZ' },
    { cw: 'CW48', projekt: 'ST_MAINZ' }, { cw: 'CW49', projekt: 'ST_MAINZ' }, { cw: 'CW50', projekt: 'ST_MAINZ' }, { cw: 'CW51', projekt: 'ST_MAINZ' }, { cw: 'CW52', projekt: 'ST_MAINZ' }
  ],
  'Kalafa Ján': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'ST_MAINZ' }, { cw: 'CW35', projekt: 'ST_MAINZ' },
    { cw: 'CW36', projekt: 'ST_MAINZ' }, { cw: 'CW37', projekt: 'ST_MAINZ' }, { cw: 'CW38', projekt: 'ST_MAINZ' }, { cw: 'CW39', projekt: 'ST_MAINZ' },
    { cw: 'CW40', projekt: 'ST_MAINZ' }, { cw: 'CW41', projekt: 'ST_MAINZ' }, { cw: 'CW42', projekt: 'ST_MAINZ' }, { cw: 'CW43', projekt: 'ST_MAINZ' },
    { cw: 'CW44', projekt: 'ST_MAINZ' }, { cw: 'CW45', projekt: 'ST_MAINZ' }, { cw: 'CW46', projekt: 'ST_MAINZ' }, { cw: 'CW47', projekt: 'ST_MAINZ' },
    { cw: 'CW48', projekt: 'ST_MAINZ' }, { cw: 'CW49', projekt: 'ST_MAINZ' }, { cw: 'CW50', projekt: 'ST_MAINZ' }, { cw: 'CW51', projekt: 'ST_MAINZ' }, { cw: 'CW52', projekt: 'ST_MAINZ' }
  ],
  'Lengyel Martin': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'ST_MAINZ' }, { cw: 'CW35', projekt: 'ST_MAINZ' },
    { cw: 'CW36', projekt: 'ST_MAINZ' }, { cw: 'CW37', projekt: 'ST_MAINZ' }, { cw: 'CW38', projekt: 'ST_MAINZ' }, { cw: 'CW39', projekt: 'ST_MAINZ' },
    { cw: 'CW40', projekt: 'ST_MAINZ' }, { cw: 'CW41', projekt: 'ST_MAINZ' }, { cw: 'CW42', projekt: 'ST_MAINZ' }, { cw: 'CW43', projekt: 'ST_MAINZ' },
    { cw: 'CW44', projekt: 'ST_MAINZ' }, { cw: 'CW45', projekt: 'ST_MAINZ' }, { cw: 'CW46', projekt: 'ST_MAINZ' }, { cw: 'CW47', projekt: 'ST_MAINZ' },
    { cw: 'CW48', projekt: 'ST_MAINZ' }, { cw: 'CW49', projekt: 'ST_MAINZ' }, { cw: 'CW50', projekt: 'ST_MAINZ' }, { cw: 'CW51', projekt: 'ST_MAINZ' }, { cw: 'CW52', projekt: 'ST_MAINZ' }
  ],
  'Šoupa Karel': [
    { cw: 'CW32', projekt: 'DOVOLENÁ' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'FREE' }, { cw: 'CW35', projekt: 'FREE' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Večeř Jiří': [
    { cw: 'CW32', projekt: 'ST_EMU_INT' }, { cw: 'CW33', projekt: 'ST_EMU_INT' }, { cw: 'CW34', projekt: 'ST_EMU_INT' }, { cw: 'CW35', projekt: 'ST_EMU_INT' },
    { cw: 'CW36', projekt: 'ST_EMU_INT' }, { cw: 'CW37', projekt: 'ST_EMU_INT' }, { cw: 'CW38', projekt: 'ST_EMU_INT' }, { cw: 'CW39', projekt: 'ST_EMU_INT' },
    { cw: 'CW40', projekt: 'ST_EMU_INT' }, { cw: 'CW41', projekt: 'ST_EMU_INT' }, { cw: 'CW42', projekt: 'ST_EMU_INT' }, { cw: 'CW43', projekt: 'ST_EMU_INT' },
    { cw: 'CW44', projekt: 'ST_EMU_INT' }, { cw: 'CW45', projekt: 'ST_EMU_INT' }, { cw: 'CW46', projekt: 'ST_EMU_INT' }, { cw: 'CW47', projekt: 'ST_EMU_INT' },
    { cw: 'CW48', projekt: 'ST_EMU_INT' }, { cw: 'CW49', projekt: 'ST_EMU_INT' }, { cw: 'CW50', projekt: 'ST_EMU_INT' }, { cw: 'CW51', projekt: 'ST_EMU_INT' }, { cw: 'CW52', projekt: 'ST_EMU_INT' }
  ],
  'Bartovičová Agáta': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'FREE' }, { cw: 'CW35', projekt: 'FREE' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Hrachová Ivana': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'FREE' }, { cw: 'CW35', projekt: 'FREE' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Karlík Štěpán': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'ST_MAINZ' }, { cw: 'CW35', projekt: 'ST_MAINZ' },
    { cw: 'CW36', projekt: 'ST_MAINZ' }, { cw: 'CW37', projekt: 'ST_MAINZ' }, { cw: 'CW38', projekt: 'ST_MAINZ' }, { cw: 'CW39', projekt: 'ST_MAINZ' },
    { cw: 'CW40', projekt: 'ST_MAINZ' }, { cw: 'CW41', projekt: 'ST_MAINZ' }, { cw: 'CW42', projekt: 'ST_MAINZ' }, { cw: 'CW43', projekt: 'ST_MAINZ' },
    { cw: 'CW44', projekt: 'ST_MAINZ' }, { cw: 'CW45', projekt: 'ST_MAINZ' }, { cw: 'CW46', projekt: 'ST_MAINZ' }, { cw: 'CW47', projekt: 'ST_MAINZ' },
    { cw: 'CW48', projekt: 'ST_MAINZ' }, { cw: 'CW49', projekt: 'ST_MAINZ' }, { cw: 'CW50', projekt: 'ST_MAINZ' }, { cw: 'CW51', projekt: 'ST_MAINZ' }, { cw: 'CW52', projekt: 'ST_MAINZ' }
  ],
  'Friedlová Jiřina': [
    { cw: 'CW32', projekt: 'ST_BLAVA' }, { cw: 'CW33', projekt: 'ST_POZAR' }, { cw: 'CW34', projekt: 'ST_EMU_INT' }, { cw: 'CW35', projekt: 'ST_TRAM_INT' },
    { cw: 'CW36', projekt: 'DOVOLENÁ' }, { cw: 'CW37', projekt: 'ST_TRAM_HS' }, { cw: 'CW38', projekt: 'ST_EMU_INT' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'ST_POZAR' }, { cw: 'CW41', projekt: 'ST_TRAM_HS' }, { cw: 'CW42', projekt: 'ST_TRAM_INT' }, { cw: 'CW43', projekt: 'ST_POZAR' },
    { cw: 'CW44', projekt: 'ST_EMU_INT' }, { cw: 'CW45', projekt: 'ST_BLAVA' }, { cw: 'CW46', projekt: 'ST_POZAR' }, { cw: 'CW47', projekt: 'ST_EMU_INT' },
    { cw: 'CW48', projekt: 'ST_TRAM_INT' }, { cw: 'CW49', projekt: 'ST_POZAR' }, { cw: 'CW50', projekt: 'ST_TRAM_HS' }, { cw: 'CW51', projekt: 'ST_EMU_INT' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Fuchs Pavel': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'FREE' }, { cw: 'CW35', projekt: 'FREE' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Mohelník Martin': [
    { cw: 'CW32', projekt: 'ST_EMU_INT' }, { cw: 'CW33', projekt: 'ST_EMU_INT' }, { cw: 'CW34', projekt: 'ST_EMU_INT' }, { cw: 'CW35', projekt: 'ST_EMU_INT' },
    { cw: 'CW36', projekt: 'ST_EMU_INT' }, { cw: 'CW37', projekt: 'ST_EMU_INT' }, { cw: 'CW38', projekt: 'ST_EMU_INT' }, { cw: 'CW39', projekt: 'ST_EMU_INT' },
    { cw: 'CW40', projekt: 'ST_EMU_INT' }, { cw: 'CW41', projekt: 'ST_EMU_INT' }, { cw: 'CW42', projekt: 'ST_EMU_INT' }, { cw: 'CW43', projekt: 'ST_EMU_INT' },
    { cw: 'CW44', projekt: 'ST_EMU_INT' }, { cw: 'CW45', projekt: 'ST_EMU_INT' }, { cw: 'CW46', projekt: 'ST_EMU_INT' }, { cw: 'CW47', projekt: 'ST_EMU_INT' },
    { cw: 'CW48', projekt: 'ST_EMU_INT' }, { cw: 'CW49', projekt: 'ST_EMU_INT' }, { cw: 'CW50', projekt: 'ST_EMU_INT' }, { cw: 'CW51', projekt: 'ST_EMU_INT' }, { cw: 'CW52', projekt: 'ST_EMU_INT' }
  ],
  'Nedavaška Petr': [
    { cw: 'CW32', projekt: 'ST_BLAVA' }, { cw: 'CW33', projekt: 'ST_BLAVA' }, { cw: 'CW34', projekt: 'ST_BLAVA' }, { cw: 'CW35', projekt: 'ST_BLAVA' },
    { cw: 'CW36', projekt: 'SAF_FEM' }, { cw: 'CW37', projekt: 'SAF_FEM' }, { cw: 'CW38', projekt: 'SAF_FEM' }, { cw: 'CW39', projekt: 'SAF_FEM' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Šedovičová Darina': [
    { cw: 'CW32', projekt: 'ST_BLAVA' }, { cw: 'CW33', projekt: 'ST_BLAVA' }, { cw: 'CW34', projekt: 'ST_BLAVA' }, { cw: 'CW35', projekt: 'ST_BLAVA' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Ješš Jozef': [
    { cw: 'CW32', projekt: 'ST_BLAVA' }, { cw: 'CW33', projekt: 'ST_BLAVA' }, { cw: 'CW34', projekt: 'ST_BLAVA' }, { cw: 'CW35', projekt: 'ST_BLAVA' },
    { cw: 'CW36', projekt: 'SAF_FEM' }, { cw: 'CW37', projekt: 'SAF_FEM' }, { cw: 'CW38', projekt: 'SAF_FEM' }, { cw: 'CW39', projekt: 'SAF_FEM' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Melichar Ondřej': [
    { cw: 'CW32', projekt: 'ST_BLAVA' }, { cw: 'CW33', projekt: 'ST_BLAVA' }, { cw: 'CW34', projekt: 'ST_BLAVA' }, { cw: 'CW35', projekt: 'ST_BLAVA' },
    { cw: 'CW36', projekt: 'SAF_FEM' }, { cw: 'CW37', projekt: 'SAF_FEM' }, { cw: 'CW38', projekt: 'SAF_FEM' }, { cw: 'CW39', projekt: 'SAF_FEM' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Klíma Milan': [
    { cw: 'CW32', projekt: 'ST_BLAVA' }, { cw: 'CW33', projekt: 'ST_BLAVA' }, { cw: 'CW34', projekt: 'ST_BLAVA' }, { cw: 'CW35', projekt: 'ST_BLAVA' },
    { cw: 'CW36', projekt: 'ST_MAINZ' }, { cw: 'CW37', projekt: 'ST_MAINZ' }, { cw: 'CW38', projekt: 'ST_MAINZ' }, { cw: 'CW39', projekt: 'ST_MAINZ' },
    { cw: 'CW40', projekt: 'ST_MAINZ' }, { cw: 'CW41', projekt: 'ST_MAINZ' }, { cw: 'CW42', projekt: 'ST_MAINZ' }, { cw: 'CW43', projekt: 'ST_MAINZ' },
    { cw: 'CW44', projekt: 'ST_MAINZ' }, { cw: 'CW45', projekt: 'ST_MAINZ' }, { cw: 'CW46', projekt: 'ST_MAINZ' }, { cw: 'CW47', projekt: 'ST_MAINZ' },
    { cw: 'CW48', projekt: 'ST_MAINZ' }, { cw: 'CW49', projekt: 'ST_MAINZ' }, { cw: 'CW50', projekt: 'ST_MAINZ' }, { cw: 'CW51', projekt: 'ST_MAINZ' }, { cw: 'CW52', projekt: 'ST_MAINZ' }
  ],
  'Hibler František': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'FREE' }, { cw: 'CW35', projekt: 'FREE' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Brojír Jaroslav': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'FREE' }, { cw: 'CW35', projekt: 'FREE' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'ST_MAINZ' },
    { cw: 'CW44', projekt: 'ST_MAINZ' }, { cw: 'CW45', projekt: 'ST_MAINZ' }, { cw: 'CW46', projekt: 'ST_MAINZ' }, { cw: 'CW47', projekt: 'ST_MAINZ' },
    { cw: 'CW48', projekt: 'ST_MAINZ' }, { cw: 'CW49', projekt: 'ST_MAINZ' }, { cw: 'CW50', projekt: 'ST_MAINZ' }, { cw: 'CW51', projekt: 'ST_MAINZ' }, { cw: 'CW52', projekt: 'ST_MAINZ' }
  ],
  'Madanský Peter': [
    { cw: 'CW32', projekt: 'NU_CRAIN' }, { cw: 'CW33', projekt: 'NU_CRAIN' }, { cw: 'CW34', projekt: 'NU_CRAIN' }, { cw: 'CW35', projekt: 'NU_CRAIN' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Samko Mikuláš': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'FREE' }, { cw: 'CW35', projekt: 'FREE' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ],
  'Chrenko Daniel': [
    { cw: 'CW32', projekt: 'FREE' }, { cw: 'CW33', projekt: 'FREE' }, { cw: 'CW34', projekt: 'FREE' }, { cw: 'CW35', projekt: 'FREE' },
    { cw: 'CW36', projekt: 'FREE' }, { cw: 'CW37', projekt: 'FREE' }, { cw: 'CW38', projekt: 'FREE' }, { cw: 'CW39', projekt: 'FREE' },
    { cw: 'CW40', projekt: 'FREE' }, { cw: 'CW41', projekt: 'FREE' }, { cw: 'CW42', projekt: 'FREE' }, { cw: 'CW43', projekt: 'FREE' },
    { cw: 'CW44', projekt: 'FREE' }, { cw: 'CW45', projekt: 'FREE' }, { cw: 'CW46', projekt: 'FREE' }, { cw: 'CW47', projekt: 'FREE' },
    { cw: 'CW48', projekt: 'FREE' }, { cw: 'CW49', projekt: 'FREE' }, { cw: 'CW50', projekt: 'FREE' }, { cw: 'CW51', projekt: 'FREE' }, { cw: 'CW52', projekt: 'FREE' }
  ]
};

// Kalendářní týdny
const calendarWeeks = ['CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51', 'CW52'];

export const FreeCapacityOverview: React.FC = () => {
  // Vytvoř matici volných kapacit
  const freeCapacityMatrix = () => {
    const matrix: { [week: string]: string[] } = {};
    const totals: { [week: string]: number } = {};
    const engineerTotals: { [engineer: string]: number } = {};

    // Inicializuj matici
    calendarWeeks.forEach(week => {
      matrix[week] = [];
      totals[week] = 0;
    });

    // Projdi všechny konstruktéry
    Object.entries(realPlanningData).forEach(([engineer, weeks]) => {
      let engineerFreeWeeks = 0;
      
      weeks.forEach(week => {
        if (week.projekt === 'FREE') {
          matrix[week.cw].push(engineer);
          totals[week.cw]++;
          engineerFreeWeeks++;
        }
      });
      
      engineerTotals[engineer] = engineerFreeWeeks;
    });

    return { matrix, totals, engineerTotals };
  };

  const { matrix, totals, engineerTotals } = freeCapacityMatrix();

  // Seřaď konstruktéry podle počtu volných týdnů (sestupně)
  const sortedEngineers = Object.entries(engineerTotals)
    .filter(([_, totalFree]) => totalFree > 0)
    .sort(([, a], [, b]) => b - a);

  // Celkový počet volných týdnů
  const totalFreeWeeks = Object.values(totals).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-gradient-header text-white p-6 rounded-lg shadow-planning">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Přehled volných kapacit</h1>
            <p className="text-primary-foreground/80">Analýza dostupných konstruktérů po týdnech</p>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <Card className="p-6 shadow-card-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{sortedEngineers.length}</div>
            <div className="text-sm text-muted-foreground">Konstruktérů s volnými kapacitami</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{totalFreeWeeks}</div>
            <div className="text-sm text-muted-foreground">Celkem volných týdnů</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {Math.max(...Object.values(totals))}
            </div>
            <div className="text-sm text-muted-foreground">Max. volných lidí v týdnu</div>
          </div>
        </div>
      </Card>

      {/* Free Capacity Table */}
      <Card className="shadow-planning overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-planning-header text-white">
              <tr>
                <th className="p-3 text-left font-medium min-w-[150px] sticky left-0 bg-planning-header z-10">
                  Konstruktér
                </th>
                {calendarWeeks.map(week => (
                  <th key={week} className="p-2 text-center font-medium min-w-[60px]">
                    {week}
                  </th>
                ))}
                <th className="p-3 text-center font-medium min-w-[80px]">
                  Celkem
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Řádek s celkovými počty */}
              <tr className="bg-accent/5 border-b-2 border-accent font-bold">
                <td className="p-3 sticky left-0 bg-accent/5 z-10">
                  <Badge className="bg-accent text-accent-foreground">
                    FREE CELKEM
                  </Badge>
                </td>
                {calendarWeeks.map(week => (
                  <td key={week} className="p-2 text-center">
                    <span className={`font-bold ${
                      totals[week] >= 10 ? 'text-success' : 
                      totals[week] >= 5 ? 'text-warning' : 
                      totals[week] > 0 ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {totals[week]}
                    </span>
                  </td>
                ))}
                <td className="p-3 text-center">
                  <Badge className="bg-primary text-primary-foreground">
                    {totalFreeWeeks}
                  </Badge>
                </td>
              </tr>

              {/* Řádky pro jednotlivé konstruktéry */}
              {sortedEngineers.map(([engineer, totalFree], index) => (
                <tr 
                  key={engineer}
                  className={`
                    border-b transition-colors hover:bg-planning-cell-hover
                    ${index % 2 === 0 ? 'bg-planning-cell' : 'bg-planning-stripe'}
                  `}
                >
                  <td className="p-3 sticky left-0 z-10 font-medium bg-inherit">
                    {engineer}
                  </td>
                  {calendarWeeks.map(week => (
                    <td key={week} className="p-2 text-center">
                      {matrix[week].includes(engineer) ? (
                        <div className="w-5 h-5 bg-success rounded-full mx-auto" 
                             title={`${engineer} - ${week} FREE`} />
                      ) : (
                        <div className="w-5 h-5 bg-muted rounded-full mx-auto opacity-30" />
                      )}
                    </td>
                  ))}
                  <td className="p-3 text-center">
                    <Badge variant="secondary">
                      {totalFree}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4 shadow-card-custom">
        <h3 className="font-medium mb-3">Legenda</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success rounded-full" />
            <span className="text-sm">Volný v daném týdnu</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted rounded-full opacity-30" />
            <span className="text-sm">Obsazený v daném týdnu</span>
          </div>
        </div>
      </Card>
    </div>
  );
};