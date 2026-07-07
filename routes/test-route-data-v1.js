/* 사용자 테스트 경로 데이터: 도원동 테스트 루프 / 회사 근처 테스트 GPX
   실제 순례기록 저장용이 아니라 GPX 따라가기 기능 검증용입니다. */
window.CATHOLIC_DOWON_TEST_ROUTE_DATA = {
  "id": "dowon_test_loop",
  "name": "도원동 테스트 GPX",
  "en": "Dowon-dong Test GPX",
  "type": "test_route",
  "sourceFile": "bong0219_10758160.gpx",
  "startStampId": "D-5",
  "completionStampId": "D-1",
  "startName": "5차",
  "finishName": "1차",
  "mode": "gpx_follow_test",
  "hiddenTestOnly": true,
  "roadVerified": "user_provided",
  "safetyNote": "사용자가 직접 제작한 도원동 GPX입니다. 실제 순례기록은 저장하지 않고 GPX 따라가기 기능 테스트에만 사용합니다.",
  "features": {
    "showRouteLine": true,
    "showStampMarkers": true,
    "followMyLocationToGpx": true,
    "autoStamp": false,
    "nextStampDistance": true,
    "offRouteAlert": true,
    "completionByFinishStamp": false
  },
  "followPolicy": {
    "onRouteM": 30,
    "nearRouteM": 80,
    "offRouteM": 80,
    "watchHighAccuracy": true
  },
  "autoStampPolicy": {
    "enabled": false,
    "defaultRadiusM": 50
  },
  "stats": {
    "waypointCount": 5,
    "routeSegmentCount": 1,
    "routePointCount": 143,
    "routeDistanceM": 4316.2,
    "routeDistanceKm": 4.316,
    "expectedWalkingMinutes": 60.2,
    "maxPointGapM": 299.9
  },
  "stamps": [
    {
      "id": "D-5",
      "order": 1,
      "name": "5차",
      "en": "5차",
      "role": "start",
      "lat": 35.80796859,
      "lng": 128.53176422,
      "routePointIndex": 134,
      "routeDistanceM": 4110.3,
      "distanceToRouteM": 3.5,
      "autoStampRadiusM": 50,
      "coordinateSource": "user_uploaded_gpx_waypoint",
      "useGpxCoordinate": true
    },
    {
      "id": "D-4",
      "order": 2,
      "name": "4차",
      "en": "4차",
      "role": "test_point",
      "lat": 35.80374854,
      "lng": 128.52883525,
      "routePointIndex": 109,
      "routeDistanceM": 3365.2,
      "distanceToRouteM": 5.5,
      "autoStampRadiusM": 50,
      "coordinateSource": "user_uploaded_gpx_waypoint",
      "useGpxCoordinate": true
    },
    {
      "id": "D-3",
      "order": 3,
      "name": "3차",
      "en": "3차",
      "role": "test_point",
      "lat": 35.7975387,
      "lng": 128.53318182,
      "routePointIndex": 24,
      "routeDistanceM": 1681.3,
      "distanceToRouteM": 2.6,
      "autoStampRadiusM": 50,
      "coordinateSource": "user_uploaded_gpx_waypoint",
      "useGpxCoordinate": true
    },
    {
      "id": "D-2",
      "order": 4,
      "name": "2차",
      "en": "2차",
      "role": "test_point",
      "lat": 35.80282905,
      "lng": 128.53136023,
      "routePointIndex": 12,
      "routeDistanceM": 968.6,
      "distanceToRouteM": 1.5,
      "autoStampRadiusM": 50,
      "coordinateSource": "user_uploaded_gpx_waypoint",
      "useGpxCoordinate": true
    },
    {
      "id": "D-1",
      "order": 5,
      "name": "1차",
      "en": "1차",
      "role": "finish",
      "lat": 35.80712233,
      "lng": 128.53365044,
      "routePointIndex": 3,
      "routeDistanceM": 233.6,
      "distanceToRouteM": 0.3,
      "autoStampRadiusM": 50,
      "coordinateSource": "user_uploaded_gpx_waypoint",
      "useGpxCoordinate": true
    }
  ],
  "routeSegments": [
    {
      "id": "dowon-user-gpx-seg-1",
      "trackName": "도원동",
      "segmentIndex": 1,
      "pointCount": 143,
      "distanceM": 4316.2,
      "maxPointGapM": 299.9,
      "points": [
        {
          "lat": 35.80882781,
          "lng": 128.53333593,
          "routeIndex": 0,
          "routeDistanceM": 0.0
        },
        {
          "lat": 35.80877996,
          "lng": 128.533867,
          "routeIndex": 1,
          "routeDistanceM": 48.2
        },
        {
          "lat": 35.80823615,
          "lng": 128.5337919,
          "routeIndex": 2,
          "routeDistanceM": 109.0
        },
        {
          "lat": 35.80712243,
          "lng": 128.53364706,
          "routeIndex": 3,
          "routeDistanceM": 233.6
        },
        {
          "lat": 35.80737041,
          "lng": 128.53169441,
          "routeIndex": 4,
          "routeDistanceM": 411.8
        },
        {
          "lat": 35.8056041,
          "lng": 128.53147984,
          "routeIndex": 5,
          "routeDistanceM": 609.1
        },
        {
          "lat": 35.80457309,
          "lng": 128.53216112,
          "routeIndex": 6,
          "routeDistanceM": 739.2
        },
        {
          "lat": 35.80431641,
          "lng": 128.53182852,
          "routeIndex": 7,
          "routeDistanceM": 780.6
        },
        {
          "lat": 35.80404737,
          "lng": 128.5318178,
          "routeIndex": 8,
          "routeDistanceM": 810.5
        },
        {
          "lat": 35.8039038,
          "lng": 128.53186607,
          "routeIndex": 9,
          "routeDistanceM": 827.1
        },
        {
          "lat": 35.80379504,
          "lng": 128.53193581,
          "routeIndex": 10,
          "routeDistanceM": 840.7
        },
        {
          "lat": 35.80376893,
          "lng": 128.53200555,
          "routeIndex": 11,
          "routeDistanceM": 847.7
        },
        {
          "lat": 35.8028223,
          "lng": 128.53134616,
          "routeIndex": 12,
          "routeDistanceM": 968.6
        },
        {
          "lat": 35.80073924,
          "lng": 128.53345847,
          "routeIndex": 13,
          "routeDistanceM": 1268.5
        },
        {
          "lat": 35.80027805,
          "lng": 128.53293275,
          "routeIndex": 14,
          "routeDistanceM": 1338.3
        },
        {
          "lat": 35.79995608,
          "lng": 128.5330615,
          "routeIndex": 15,
          "routeDistanceM": 1375.9
        },
        {
          "lat": 35.79953404,
          "lng": 128.5325036,
          "routeIndex": 16,
          "routeDistanceM": 1444.7
        },
        {
          "lat": 35.79929881,
          "lng": 128.53249325,
          "routeIndex": 17,
          "routeDistanceM": 1470.9
        },
        {
          "lat": 35.79901164,
          "lng": 128.53251471,
          "routeIndex": 18,
          "routeDistanceM": 1502.9
        },
        {
          "lat": 35.7985809,
          "lng": 128.53258445,
          "routeIndex": 19,
          "routeDistanceM": 1551.2
        },
        {
          "lat": 35.79826207,
          "lng": 128.5326935,
          "routeIndex": 20,
          "routeDistanceM": 1588.0
        },
        {
          "lat": 35.79800971,
          "lng": 128.53288662,
          "routeIndex": 21,
          "routeDistanceM": 1621.0
        },
        {
          "lat": 35.7978164,
          "lng": 128.5330827,
          "routeIndex": 22,
          "routeDistanceM": 1648.9
        },
        {
          "lat": 35.79765541,
          "lng": 128.53320072,
          "routeIndex": 23,
          "routeDistanceM": 1669.7
        },
        {
          "lat": 35.79755098,
          "lng": 128.53320608,
          "routeIndex": 24,
          "routeDistanceM": 1681.3
        },
        {
          "lat": 35.79749007,
          "lng": 128.53316853,
          "routeIndex": 25,
          "routeDistanceM": 1688.9
        },
        {
          "lat": 35.79746831,
          "lng": 128.53307197,
          "routeIndex": 26,
          "routeDistanceM": 1697.9
        },
        {
          "lat": 35.79745091,
          "lng": 128.5329915,
          "routeIndex": 27,
          "routeDistanceM": 1705.4
        },
        {
          "lat": 35.79745091,
          "lng": 128.53287349,
          "routeIndex": 28,
          "routeDistanceM": 1716.1
        },
        {
          "lat": 35.79743929,
          "lng": 128.53278464,
          "routeIndex": 29,
          "routeDistanceM": 1724.2
        },
        {
          "lat": 35.79745235,
          "lng": 128.5326398,
          "routeIndex": 30,
          "routeDistanceM": 1737.3
        },
        {
          "lat": 35.79745235,
          "lng": 128.53249496,
          "routeIndex": 31,
          "routeDistanceM": 1750.4
        },
        {
          "lat": 35.79739578,
          "lng": 128.53231793,
          "routeIndex": 32,
          "routeDistanceM": 1767.6
        },
        {
          "lat": 35.79729571,
          "lng": 128.53218382,
          "routeIndex": 33,
          "routeDistanceM": 1784.0
        },
        {
          "lat": 35.79723295,
          "lng": 128.53211831,
          "routeIndex": 34,
          "routeDistanceM": 1793.1
        },
        {
          "lat": 35.79705456,
          "lng": 128.53194128,
          "routeIndex": 35,
          "routeDistanceM": 1818.6
        },
        {
          "lat": 35.79691097,
          "lng": 128.53176962,
          "routeIndex": 36,
          "routeDistanceM": 1840.8
        },
        {
          "lat": 35.79671053,
          "lng": 128.53164063,
          "routeIndex": 37,
          "routeDistanceM": 1866.0
        },
        {
          "lat": 35.79651038,
          "lng": 128.53158162,
          "routeIndex": 38,
          "routeDistanceM": 1888.9
        },
        {
          "lat": 35.7963668,
          "lng": 128.53145824,
          "routeIndex": 39,
          "routeDistanceM": 1908.3
        },
        {
          "lat": 35.79612749,
          "lng": 128.53130803,
          "routeIndex": 40,
          "routeDistanceM": 1938.2
        },
        {
          "lat": 35.79593551,
          "lng": 128.53119702,
          "routeIndex": 41,
          "routeDistanceM": 1961.8
        },
        {
          "lat": 35.79583108,
          "lng": 128.5312292,
          "routeIndex": 42,
          "routeDistanceM": 1973.7
        },
        {
          "lat": 35.79569184,
          "lng": 128.53131503,
          "routeIndex": 43,
          "routeDistanceM": 1991.0
        },
        {
          "lat": 35.79560917,
          "lng": 128.53142769,
          "routeIndex": 44,
          "routeDistanceM": 2004.7
        },
        {
          "lat": 35.79542207,
          "lng": 128.5314867,
          "routeIndex": 45,
          "routeDistanceM": 2026.2
        },
        {
          "lat": 35.79524368,
          "lng": 128.53150815,
          "routeIndex": 46,
          "routeDistanceM": 2046.1
        },
        {
          "lat": 35.79510935,
          "lng": 128.53135208,
          "routeIndex": 47,
          "routeDistanceM": 2066.7
        },
        {
          "lat": 35.79499622,
          "lng": 128.53119115,
          "routeIndex": 48,
          "routeDistanceM": 2085.9
        },
        {
          "lat": 35.79482218,
          "lng": 128.53103022,
          "routeIndex": 49,
          "routeDistanceM": 2110.1
        },
        {
          "lat": 35.7947221,
          "lng": 128.53092293,
          "routeIndex": 50,
          "routeDistanceM": 2124.8
        },
        {
          "lat": 35.79456546,
          "lng": 128.53087465,
          "routeIndex": 51,
          "routeDistanceM": 2142.8
        },
        {
          "lat": 35.79450889,
          "lng": 128.53080491,
          "routeIndex": 52,
          "routeDistanceM": 2151.7
        },
        {
          "lat": 35.79447408,
          "lng": 128.53064934,
          "routeIndex": 53,
          "routeDistanceM": 2166.2
        },
        {
          "lat": 35.79440882,
          "lng": 128.53039721,
          "routeIndex": 54,
          "routeDistanceM": 2190.1
        },
        {
          "lat": 35.79446538,
          "lng": 128.53022555,
          "routeIndex": 55,
          "routeDistanceM": 2206.8
        },
        {
          "lat": 35.79443927,
          "lng": 128.52991978,
          "routeIndex": 56,
          "routeDistanceM": 2234.5
        },
        {
          "lat": 35.79443492,
          "lng": 128.52978031,
          "routeIndex": 57,
          "routeDistanceM": 2247.1
        },
        {
          "lat": 35.79441317,
          "lng": 128.52960328,
          "routeIndex": 58,
          "routeDistanceM": 2263.3
        },
        {
          "lat": 35.79479607,
          "lng": 128.5294799,
          "routeIndex": 59,
          "routeDistanceM": 2307.3
        },
        {
          "lat": 35.79503103,
          "lng": 128.52939943,
          "routeIndex": 60,
          "routeDistanceM": 2334.4
        },
        {
          "lat": 35.79526164,
          "lng": 128.52923314,
          "routeIndex": 61,
          "routeDistanceM": 2364.1
        },
        {
          "lat": 35.79548579,
          "lng": 128.52917949,
          "routeIndex": 62,
          "routeDistanceM": 2389.5
        },
        {
          "lat": 35.79579472,
          "lng": 128.52904002,
          "routeIndex": 63,
          "routeDistanceM": 2426.1
        },
        {
          "lat": 35.7960906,
          "lng": 128.52896491,
          "routeIndex": 64,
          "routeDistanceM": 2459.7
        },
        {
          "lat": 35.79621243,
          "lng": 128.52894882,
          "routeIndex": 65,
          "routeDistanceM": 2473.3
        },
        {
          "lat": 35.79642128,
          "lng": 128.52894346,
          "routeIndex": 66,
          "routeDistanceM": 2496.5
        },
        {
          "lat": 35.79659967,
          "lng": 128.52893809,
          "routeIndex": 67,
          "routeDistanceM": 2516.4
        },
        {
          "lat": 35.79677372,
          "lng": 128.52892736,
          "routeIndex": 68,
          "routeDistanceM": 2535.7
        },
        {
          "lat": 35.79688605,
          "lng": 128.52897174,
          "routeIndex": 69,
          "routeDistanceM": 2548.9
        },
        {
          "lat": 35.79705139,
          "lng": 128.52903611,
          "routeIndex": 70,
          "routeDistanceM": 2568.1
        },
        {
          "lat": 35.7972733,
          "lng": 128.52915413,
          "routeIndex": 71,
          "routeDistanceM": 2595.0
        },
        {
          "lat": 35.79746039,
          "lng": 128.5292346,
          "routeIndex": 72,
          "routeDistanceM": 2617.0
        },
        {
          "lat": 35.79768229,
          "lng": 128.52929361,
          "routeIndex": 73,
          "routeDistanceM": 2642.3
        },
        {
          "lat": 35.7979475,
          "lng": 128.52937477,
          "routeIndex": 74,
          "routeDistanceM": 2672.7
        },
        {
          "lat": 35.79812154,
          "lng": 128.52943377,
          "routeIndex": 75,
          "routeDistanceM": 2692.7
        },
        {
          "lat": 35.79831298,
          "lng": 128.52949278,
          "routeIndex": 76,
          "routeDistanceM": 2714.7
        },
        {
          "lat": 35.79847832,
          "lng": 128.52953033,
          "routeIndex": 77,
          "routeDistanceM": 2733.4
        },
        {
          "lat": 35.79863495,
          "lng": 128.52960007,
          "routeIndex": 78,
          "routeDistanceM": 2751.9
        },
        {
          "lat": 35.79870892,
          "lng": 128.52962689,
          "routeIndex": 79,
          "routeDistanceM": 2760.5
        },
        {
          "lat": 35.79891673,
          "lng": 128.52951424,
          "routeIndex": 80,
          "routeDistanceM": 2785.7
        },
        {
          "lat": 35.79915603,
          "lng": 128.52950351,
          "routeIndex": 81,
          "routeDistanceM": 2812.3
        },
        {
          "lat": 35.79941709,
          "lng": 128.52943914,
          "routeIndex": 82,
          "routeDistanceM": 2841.9
        },
        {
          "lat": 35.79957807,
          "lng": 128.5293855,
          "routeIndex": 83,
          "routeDistanceM": 2860.5
        },
        {
          "lat": 35.79979997,
          "lng": 128.52931039,
          "routeIndex": 84,
          "routeDistanceM": 2886.1
        },
        {
          "lat": 35.7999566,
          "lng": 128.5292192,
          "routeIndex": 85,
          "routeDistanceM": 2905.3
        },
        {
          "lat": 35.80011758,
          "lng": 128.5291441,
          "routeIndex": 86,
          "routeDistanceM": 2924.5
        },
        {
          "lat": 35.80030902,
          "lng": 128.52901535,
          "routeIndex": 87,
          "routeDistanceM": 2948.7
        },
        {
          "lat": 35.80047,
          "lng": 128.52891343,
          "routeIndex": 88,
          "routeDistanceM": 2968.8
        },
        {
          "lat": 35.80076447,
          "lng": 128.52878834,
          "routeIndex": 89,
          "routeDistanceM": 3003.5
        },
        {
          "lat": 35.80095156,
          "lng": 128.5288098,
          "routeIndex": 90,
          "routeDistanceM": 3024.4
        },
        {
          "lat": 35.80116475,
          "lng": 128.52874542,
          "routeIndex": 91,
          "routeDistanceM": 3048.8
        },
        {
          "lat": 35.80139534,
          "lng": 128.52867032,
          "routeIndex": 92,
          "routeDistanceM": 3075.3
        },
        {
          "lat": 35.80155632,
          "lng": 128.52863814,
          "routeIndex": 93,
          "routeDistanceM": 3093.4
        },
        {
          "lat": 35.8017347,
          "lng": 128.5285684,
          "routeIndex": 94,
          "routeDistanceM": 3114.2
        },
        {
          "lat": 35.80192139,
          "lng": 128.52847476,
          "routeIndex": 95,
          "routeDistanceM": 3136.6
        },
        {
          "lat": 35.80205191,
          "lng": 128.52842648,
          "routeIndex": 96,
          "routeDistanceM": 3151.8
        },
        {
          "lat": 35.80220854,
          "lng": 128.52842648,
          "routeIndex": 97,
          "routeDistanceM": 3169.2
        },
        {
          "lat": 35.80236952,
          "lng": 128.52838357,
          "routeIndex": 98,
          "routeDistanceM": 3187.5
        },
        {
          "lat": 35.80251745,
          "lng": 128.52834065,
          "routeIndex": 99,
          "routeDistanceM": 3204.4
        },
        {
          "lat": 35.80266102,
          "lng": 128.52831383,
          "routeIndex": 100,
          "routeDistanceM": 3220.6
        },
        {
          "lat": 35.8028481,
          "lng": 128.52831383,
          "routeIndex": 101,
          "routeDistanceM": 3241.4
        },
        {
          "lat": 35.80296992,
          "lng": 128.52832456,
          "routeIndex": 102,
          "routeDistanceM": 3254.9
        },
        {
          "lat": 35.80312485,
          "lng": 128.52835566,
          "routeIndex": 103,
          "routeDistanceM": 3272.4
        },
        {
          "lat": 35.80320751,
          "lng": 128.52838784,
          "routeIndex": 104,
          "routeDistanceM": 3282.0
        },
        {
          "lat": 35.80326842,
          "lng": 128.52845758,
          "routeIndex": 105,
          "routeDistanceM": 3291.3
        },
        {
          "lat": 35.80338154,
          "lng": 128.52856487,
          "routeIndex": 106,
          "routeDistanceM": 3307.2
        },
        {
          "lat": 35.80341634,
          "lng": 128.52862924,
          "routeIndex": 107,
          "routeDistanceM": 3314.1
        },
        {
          "lat": 35.80349466,
          "lng": 128.52891356,
          "routeIndex": 108,
          "routeDistanceM": 3341.2
        },
        {
          "lat": 35.80369914,
          "lng": 128.52882773,
          "routeIndex": 109,
          "routeDistanceM": 3365.2
        },
        {
          "lat": 35.80394278,
          "lng": 128.52869898,
          "routeIndex": 110,
          "routeDistanceM": 3394.7
        },
        {
          "lat": 35.80425602,
          "lng": 128.52854878,
          "routeIndex": 111,
          "routeDistanceM": 3432.1
        },
        {
          "lat": 35.80434739,
          "lng": 128.52851123,
          "routeIndex": 112,
          "routeDistanceM": 3442.8
        },
        {
          "lat": 35.80468239,
          "lng": 128.52841467,
          "routeIndex": 113,
          "routeDistanceM": 3481.0
        },
        {
          "lat": 35.80484336,
          "lng": 128.52838784,
          "routeIndex": 114,
          "routeDistanceM": 3499.1
        },
        {
          "lat": 35.80509135,
          "lng": 128.52835566,
          "routeIndex": 115,
          "routeDistanceM": 3526.8
        },
        {
          "lat": 35.8051359,
          "lng": 128.52871093,
          "routeIndex": 116,
          "routeDistanceM": 3559.2
        },
        {
          "lat": 35.80517505,
          "lng": 128.5290918,
          "routeIndex": 117,
          "routeDistanceM": 3593.9
        },
        {
          "lat": 35.80521856,
          "lng": 128.52929029,
          "routeIndex": 118,
          "routeDistanceM": 3612.4
        },
        {
          "lat": 35.80530122,
          "lng": 128.52960679,
          "routeIndex": 119,
          "routeDistanceM": 3642.4
        },
        {
          "lat": 35.80540128,
          "lng": 128.52991256,
          "routeIndex": 120,
          "routeDistanceM": 3672.1
        },
        {
          "lat": 35.80550292,
          "lng": 128.53011534,
          "routeIndex": 121,
          "routeDistanceM": 3693.6
        },
        {
          "lat": 35.80558123,
          "lng": 128.53028701,
          "routeIndex": 122,
          "routeDistanceM": 3711.4
        },
        {
          "lat": 35.80563778,
          "lng": 128.53056596,
          "routeIndex": 123,
          "routeDistanceM": 3737.3
        },
        {
          "lat": 35.80563778,
          "lng": 128.53091464,
          "routeIndex": 124,
          "routeDistanceM": 3768.8
        },
        {
          "lat": 35.8055953,
          "lng": 128.53115799,
          "routeIndex": 125,
          "routeDistanceM": 3791.2
        },
        {
          "lat": 35.80554309,
          "lng": 128.53132965,
          "routeIndex": 126,
          "routeDistanceM": 3807.7
        },
        {
          "lat": 35.80546478,
          "lng": 128.53152813,
          "routeIndex": 127,
          "routeDistanceM": 3827.6
        },
        {
          "lat": 35.80591289,
          "lng": 128.53152813,
          "routeIndex": 128,
          "routeDistanceM": 3877.5
        },
        {
          "lat": 35.80640965,
          "lng": 128.5315954,
          "routeIndex": 129,
          "routeDistanceM": 3933.0
        },
        {
          "lat": 35.806805,
          "lng": 128.5316487,
          "routeIndex": 130,
          "routeDistanceM": 3977.3
        },
        {
          "lat": 35.80704862,
          "lng": 128.53167016,
          "routeIndex": 131,
          "routeDistanceM": 4004.4
        },
        {
          "lat": 35.80748802,
          "lng": 128.53172381,
          "routeIndex": 132,
          "routeDistanceM": 4053.5
        },
        {
          "lat": 35.80783735,
          "lng": 128.5317399,
          "routeIndex": 133,
          "routeDistanceM": 4092.4
        },
        {
          "lat": 35.80799832,
          "lng": 128.53175063,
          "routeIndex": 134,
          "routeDistanceM": 4110.3
        },
        {
          "lat": 35.80800252,
          "lng": 128.53199185,
          "routeIndex": 135,
          "routeDistanceM": 4132.1
        },
        {
          "lat": 35.8079236,
          "lng": 128.53263581,
          "routeIndex": 136,
          "routeDistanceM": 4190.8
        },
        {
          "lat": 35.80818028,
          "lng": 128.53268409,
          "routeIndex": 137,
          "routeDistanceM": 4219.7
        },
        {
          "lat": 35.80824988,
          "lng": 128.53282356,
          "routeIndex": 138,
          "routeDistanceM": 4234.4
        },
        {
          "lat": 35.80842825,
          "lng": 128.53290838,
          "routeIndex": 139,
          "routeDistanceM": 4255.7
        },
        {
          "lat": 35.80858487,
          "lng": 128.53300494,
          "routeIndex": 140,
          "routeDistanceM": 4275.2
        },
        {
          "lat": 35.80870668,
          "lng": 128.53309614,
          "routeIndex": 141,
          "routeDistanceM": 4291.0
        },
        {
          "lat": 35.80881979,
          "lng": 128.53333754,
          "routeIndex": 142,
          "routeDistanceM": 4316.2
        }
      ]
    }
  ]
};


window.CATHOLIC_COMPANY_TEST_ROUTE_DATA = {
  "id": "company_test_route",
  "name": "회사 근처 테스트 GPX",
  "en": "Company Test GPX",
  "type": "test_route",
  "sourceFile": "bong0219_10759916(4).gpx",
  "sourceLabel": "회사 근처 사용자가 직접 그린 GPX",
  "startStampId": "C-4",
  "completionStampId": "C-3",
  "startName": "4차",
  "finishName": "3차",
  "mode": "gpx_follow_test",
  "hiddenTestOnly": true,
  "roadVerified": "user_provided",
  "safetyNote": "사용자가 직접 제작한 회사 근처 GPX입니다. 실제 순례기록은 저장하지 않고 GPX 따라가기 기능 테스트에만 사용합니다.",
  "features": {
    "showRouteLine": true,
    "showStampMarkers": true,
    "followMyLocationToGpx": true,
    "autoStamp": false,
    "nextStampDistance": true,
    "offRouteAlert": true,
    "completionByFinishStamp": false
  },
  "followPolicy": {
    "onRouteM": 30,
    "nearRouteM": 80,
    "offRouteM": 80,
    "watchHighAccuracy": true
  },
  "autoStampPolicy": {
    "enabled": false,
    "defaultRadiusM": 50
  },
  "stats": {
    "waypointCount": 4,
    "routeSegmentCount": 1,
    "routePointCount": 49,
    "routeDistanceM": 833.2,
    "routeDistanceKm": 0.833,
    "expectedWalkingMinutes": 11.6,
    "maxPointGapM": 43.3
  },
  "stamps": [
    {
      "id": "C-4",
      "order": 1,
      "name": "4차",
      "en": "4",
      "role": "start",
      "lat": 35.84202817,
      "lng": 128.47488076,
      "routePointIndex": 2,
      "routeDistanceM": 66.8,
      "distanceToRouteM": 2.9,
      "autoStampRadiusM": 50,
      "coordinateSource": "user_uploaded_company_gpx_waypoint",
      "useGpxCoordinate": true
    },
    {
      "id": "C-3",
      "order": 2,
      "name": "3차",
      "en": "3",
      "role": "finish",
      "lat": 35.84202382,
      "lng": 128.47676294,
      "routePointIndex": 43,
      "routeDistanceM": 721.8,
      "distanceToRouteM": 6.2,
      "autoStampRadiusM": 50,
      "coordinateSource": "user_uploaded_company_gpx_waypoint",
      "useGpxCoordinate": true
    },
    {
      "id": "C-2",
      "order": 3,
      "name": "2차",
      "en": "2",
      "role": "test_point",
      "lat": 35.84088435,
      "lng": 128.47802104,
      "routePointIndex": 30,
      "routeDistanceM": 490.0,
      "distanceToRouteM": 0.6,
      "autoStampRadiusM": 50,
      "coordinateSource": "user_uploaded_company_gpx_waypoint",
      "useGpxCoordinate": true
    },
    {
      "id": "C-1",
      "order": 4,
      "name": "1차",
      "en": "1",
      "role": "test_point",
      "lat": 35.84083669,
      "lng": 128.47483813,
      "routePointIndex": 10,
      "routeDistanceM": 201.3,
      "distanceToRouteM": 0.5,
      "autoStampRadiusM": 50,
      "coordinateSource": "user_uploaded_company_gpx_waypoint",
      "useGpxCoordinate": true
    }
  ],
  "routeSegments": [
    {
      "id": "company-user-gpx-seg-1",
      "trackName": "파",
      "segmentIndex": 1,
      "pointCount": 49,
      "distanceM": 833.2,
      "maxPointGapM": 43.3,
      "points": [
        {
          "lat": 35.84204841,
          "lng": 128.47559315,
          "routeIndex": 0,
          "routeDistanceM": 0.0
        },
        {
          "lat": 35.84203319,
          "lng": 128.47511303,
          "routeIndex": 1,
          "routeDistanceM": 43.3
        },
        {
          "lat": 35.84204188,
          "lng": 128.47485286,
          "routeIndex": 2,
          "routeDistanceM": 66.8
        },
        {
          "lat": 35.84181793,
          "lng": 128.47480726,
          "routeIndex": 3,
          "routeDistanceM": 92.0
        },
        {
          "lat": 35.84163094,
          "lng": 128.47481262,
          "routeIndex": 4,
          "routeDistanceM": 112.8
        },
        {
          "lat": 35.84157006,
          "lng": 128.47481799,
          "routeIndex": 5,
          "routeDistanceM": 119.6
        },
        {
          "lat": 35.8414483,
          "lng": 128.47483945,
          "routeIndex": 6,
          "routeDistanceM": 133.3
        },
        {
          "lat": 35.84135698,
          "lng": 128.47483945,
          "routeIndex": 7,
          "routeDistanceM": 143.4
        },
        {
          "lat": 35.8411352,
          "lng": 128.47481799,
          "routeIndex": 8,
          "routeDistanceM": 168.2
        },
        {
          "lat": 35.84093516,
          "lng": 128.47485017,
          "routeIndex": 9,
          "routeDistanceM": 190.6
        },
        {
          "lat": 35.84083949,
          "lng": 128.47483408,
          "routeIndex": 10,
          "routeDistanceM": 201.3
        },
        {
          "lat": 35.84085254,
          "lng": 128.47494137,
          "routeIndex": 11,
          "routeDistanceM": 211.1
        },
        {
          "lat": 35.84085254,
          "lng": 128.47515595,
          "routeIndex": 12,
          "routeDistanceM": 230.5
        },
        {
          "lat": 35.84085254,
          "lng": 128.47532224,
          "routeIndex": 13,
          "routeDistanceM": 245.5
        },
        {
          "lat": 35.84084819,
          "lng": 128.47545099,
          "routeIndex": 14,
          "routeDistanceM": 257.1
        },
        {
          "lat": 35.84087428,
          "lng": 128.47564947,
          "routeIndex": 15,
          "routeDistanceM": 275.2
        },
        {
          "lat": 35.84084384,
          "lng": 128.47585868,
          "routeIndex": 16,
          "routeDistanceM": 294.4
        },
        {
          "lat": 35.84083514,
          "lng": 128.47603571,
          "routeIndex": 17,
          "routeDistanceM": 310.3
        },
        {
          "lat": 35.84083949,
          "lng": 128.47613227,
          "routeIndex": 18,
          "routeDistanceM": 319.1
        },
        {
          "lat": 35.84083949,
          "lng": 128.47629857,
          "routeIndex": 19,
          "routeDistanceM": 334.0
        },
        {
          "lat": 35.84084819,
          "lng": 128.4765346,
          "routeIndex": 20,
          "routeDistanceM": 355.3
        },
        {
          "lat": 35.84085254,
          "lng": 128.47666335,
          "routeIndex": 21,
          "routeDistanceM": 367.0
        },
        {
          "lat": 35.84085254,
          "lng": 128.476776,
          "routeIndex": 22,
          "routeDistanceM": 377.1
        },
        {
          "lat": 35.84085254,
          "lng": 128.47690475,
          "routeIndex": 23,
          "routeDistanceM": 388.7
        },
        {
          "lat": 35.84085254,
          "lng": 128.47711396,
          "routeIndex": 24,
          "routeDistanceM": 407.6
        },
        {
          "lat": 35.84085254,
          "lng": 128.47719979,
          "routeIndex": 25,
          "routeDistanceM": 415.3
        },
        {
          "lat": 35.84086558,
          "lng": 128.4773339,
          "routeIndex": 26,
          "routeDistanceM": 427.5
        },
        {
          "lat": 35.84087863,
          "lng": 128.47747874,
          "routeIndex": 27,
          "routeDistanceM": 440.6
        },
        {
          "lat": 35.84087863,
          "lng": 128.47759676,
          "routeIndex": 28,
          "routeDistanceM": 451.3
        },
        {
          "lat": 35.84087863,
          "lng": 128.47784352,
          "routeIndex": 29,
          "routeDistanceM": 473.5
        },
        {
          "lat": 35.84088733,
          "lng": 128.47802591,
          "routeIndex": 30,
          "routeDistanceM": 490.0
        },
        {
          "lat": 35.84098735,
          "lng": 128.4780581,
          "routeIndex": 31,
          "routeDistanceM": 501.5
        },
        {
          "lat": 35.84113955,
          "lng": 128.4780581,
          "routeIndex": 32,
          "routeDistanceM": 518.4
        },
        {
          "lat": 35.8412787,
          "lng": 128.47803664,
          "routeIndex": 33,
          "routeDistanceM": 534.0
        },
        {
          "lat": 35.84162224,
          "lng": 128.47805273,
          "routeIndex": 34,
          "routeDistanceM": 572.2
        },
        {
          "lat": 35.84176575,
          "lng": 128.47803664,
          "routeIndex": 35,
          "routeDistanceM": 588.2
        },
        {
          "lat": 35.84186142,
          "lng": 128.47802055,
          "routeIndex": 36,
          "routeDistanceM": 599.0
        },
        {
          "lat": 35.84199187,
          "lng": 128.47802591,
          "routeIndex": 37,
          "routeDistanceM": 613.5
        },
        {
          "lat": 35.84200927,
          "lng": 128.47793471,
          "routeIndex": 38,
          "routeDistanceM": 621.9
        },
        {
          "lat": 35.84201362,
          "lng": 128.47766649,
          "routeIndex": 39,
          "routeDistanceM": 646.1
        },
        {
          "lat": 35.84200927,
          "lng": 128.4775002,
          "routeIndex": 40,
          "routeDistanceM": 661.1
        },
        {
          "lat": 35.84200927,
          "lng": 128.47728562,
          "routeIndex": 41,
          "routeDistanceM": 680.5
        },
        {
          "lat": 35.84199187,
          "lng": 128.4769262,
          "routeIndex": 42,
          "routeDistanceM": 712.9
        },
        {
          "lat": 35.84200927,
          "lng": 128.47682964,
          "routeIndex": 43,
          "routeDistanceM": 721.8
        },
        {
          "lat": 35.84201362,
          "lng": 128.47641658,
          "routeIndex": 44,
          "routeDistanceM": 759.1
        },
        {
          "lat": 35.84201797,
          "lng": 128.47620201,
          "routeIndex": 45,
          "routeDistanceM": 778.4
        },
        {
          "lat": 35.84201797,
          "lng": 128.47603571,
          "routeIndex": 46,
          "routeDistanceM": 793.4
        },
        {
          "lat": 35.84203101,
          "lng": 128.47565484,
          "routeIndex": 47,
          "routeDistanceM": 827.8
        },
        {
          "lat": 35.84205275,
          "lng": 128.47560119,
          "routeIndex": 48,
          "routeDistanceM": 833.2
        }
      ]
    }
  ]
};

(function(){
  window.PILGRIMAGE_ROUTES = window.PILGRIMAGE_ROUTES || [];
  var routes = [
    window.CATHOLIC_DOWON_TEST_ROUTE_DATA,
    window.CATHOLIC_COMPANY_TEST_ROUTE_DATA
  ].filter(Boolean);
  routes.forEach(function(route){
    route.hiddenTestOnly = false;
    route.type = route.type || 'test_route';
    route.routeGroup = '테스트 경로';
    route.dataQuality = 'user-test-gpx';
    route.lineType = 'gpx';
    route.testOnly = true;
    route.distanceLabel = route.stats && Number.isFinite(Number(route.stats.routeDistanceKm))
      ? '약 ' + Number(route.stats.routeDistanceKm).toFixed(1) + 'km'
      : route.distanceLabel;
    window.PILGRIMAGE_ROUTES.push(route);
  });
})();
