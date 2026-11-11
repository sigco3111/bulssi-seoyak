import {EXTRA_LAYOUTS,EXTRA_LIGHTING} from './expansion-data.js';
export const MAP_LAYOUTS={...EXTRA_LAYOUTS,
 meadow:{centers:[[17,29],[7,25],[27,25],[6,16],[26,16],[17,11],[7,7],[28,7],[17,3]],shape:'glades',names:['푸른 수로의 잔해','멈춘 물레의 샘','사냥꾼의 돌무덤','송곳니의 원형 뜰'],hint:'물레 아래 새겨진 표식이 샛길의 봉인을 가리킵니다.'},
 cemetery:{centers:[[17,29],[8,26],[26,25],[7,17],[27,16],[17,13],[8,7],[28,7],[17,3]],shape:'courts',names:['순례자의 묘문','갈라진 납골당','이름 없는 추모석','문지기의 봉인문'],hint:'이름을 잃은 두 묘비의 기록을 모으면 보관함이 열립니다.'},
 thorns:{centers:[[17,29],[7,25],[27,24],[5,17],[28,15],[17,13],[7,7],[26,6],[17,3]],shape:'glades',names:['뿌리에 삼켜진 문','잊힌 수호목','사냥꾼의 은신처','늙은 송곳니의 둥지'],hint:'뿌리 사이 샛길에는 길잡이가 남긴 새김이 있습니다.'},
 marsh:{centers:[[17,29],[7,26],[27,25],[9,17],[27,16],[18,12],[6,7],[28,7],[17,3]],shape:'islands',names:['반딧불 수문','가라앉은 선착장','녹색 숨의 샘','어미의 침수 제단'],hint:'두 개의 기록을 읽고 물에 잠긴 보관함의 봉인을 푸세요.'},
 ridge:{centers:[[17,29],[9,25],[28,26],[6,17],[28,16],[18,11],[7,7],[28,7],[17,3]],shape:'glades',names:['깃발이 우는 성문','바람의 봉화대','추방자의 돌탑','붉은 바람의 관문'],hint:'성문 너머 두 정찰 표식이 버려진 보급함을 가리킵니다.'},
 mine:{centers:[[17,29],[7,25],[27,24],[6,16],[28,16],[17,12],[7,7],[28,6],[17,3]],shape:'galleries',names:['깨진 운반 궤도','청록 수정의 맥','광부의 마지막 쉼터','굴착자의 철문'],hint:'광부의 기록 두 장에 봉인 보관함의 열쇠가 남아 있습니다.'},
 abbey:{centers:[[17,29],[7,25],[27,25],[8,17],[26,17],[17,11],[7,7],[28,7],[17,3]],shape:'courts',names:['침묵의 회랑','깨진 장미창','촛불의 고해소','종지기의 대성문'],hint:'두 기록을 읽으면 종지기가 감춘 보관함을 열 수 있습니다.'}
};
export const WORLD_LIGHTING={...EXTRA_LIGHTING,
 grass:{key:0xffe7bc,fill:0x9fc8c2,sky:0xadbfa1,ground:0x48533b,exposure:1.19},
 grave:{key:0xb6cbe5,fill:0x8985b2,sky:0x8fadc4,ground:0x353b49,exposure:1.13},
 forest:{key:0xd5dfb9,fill:0x6fada3,sky:0x8cae9b,ground:0x2b493b,exposure:1.20},
 marsh:{key:0xb2d2c2,fill:0x6fadc0,sky:0x83b1ae,ground:0x284f49,exposure:1.19},
 ridge:{key:0xffcc97,fill:0x93aabe,sky:0xc1b498,ground:0x4b4842,exposure:1.20},
 mine:{key:0xdcc6a5,fill:0x71b2bd,sky:0x92a8af,ground:0x383b40,exposure:1.16},
 abbey:{key:0xf3d6aa,fill:0x9bb4c9,sky:0xb4b8ad,ground:0x41464c,exposure:1.17}
};
