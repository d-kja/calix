use wasm_bindgen::prelude::*;

#[wasm_bindgen(module = "/utils/get-random.ts")]
extern "C" {
    fn gen_random(ceil: usize) -> usize;
}

#[derive(PartialEq, Eq, Clone, Copy)]
#[wasm_bindgen]
pub enum Status {
    PAUSED,
    PLAYING,
    WON,
    LOST,
}

#[derive(Clone, Copy)]
#[wasm_bindgen]
pub enum Kind {
    BOMB,
    EMPTY,
}

impl From<String> for Kind {
    fn from(value: String) -> Self {
        use Kind::*;

        match value.to_lowercase().as_str() {
            "bomb" => BOMB,
            _ => EMPTY,
        }
    }
}

impl Into<String> for Kind {
    fn into(self) -> String {
        use Kind::*;

        match self {
            EMPTY => "Empty".to_owned(),
            BOMB => "Bomb".to_owned(),
        }
    }
}

#[derive(Clone, Copy)]
#[wasm_bindgen]
pub struct Cell {
    pub index: usize,
    pub kind: Kind,
    pub dirty: bool,
}

#[wasm_bindgen]
impl Cell {
    fn new(index: usize, kind: Option<Kind>) -> Self {
        Self {
            index,
            kind: kind.unwrap_or(Kind::EMPTY),
            dirty: false,
        }
    }

    pub fn create_many(quantity: usize) -> Vec<Cell> {
        let mut cells: Vec<Self> = Vec::new();

        for idx in 0..quantity {
            let rand = gen_random(1);
            let kind = if rand.eq(&1) { Some(Kind::BOMB) } else { None };

            let cell = Self::new(idx, kind);

            cells.push(cell);
        }

        cells
    }

    pub fn get_kind_str(&self) -> String {
        self.kind.into()
    }
}

#[wasm_bindgen]
pub struct Game {
    cells: Vec<Cell>,
    pub status: Option<Status>,
}

#[wasm_bindgen]
impl Game {
    pub fn new(cell_qtd: Option<usize>) -> Self {
        Self {
            cells: Cell::create_many(cell_qtd.unwrap_or(99)),
            status: None,
        }
    }

    pub fn get_cells(&self) -> Vec<Cell> {
        self.cells.clone()
    }

    pub fn get_cell(&self, index: usize) -> Cell {
        assert!(
            self.cells.len() >= index,
            "chosen index should respect the boundaries of the game"
        );

        let cell = self
            .cells
            .iter()
            .find(|&item| item.index.eq(&index))
            .expect("this should not throw");

        *cell
    }

    pub fn touch_cell(&mut self, index: usize) {
        let cell = self.get_cell(index);
        let mut status = match &cell.kind {
            Kind::BOMB => Status::LOST,
            _ => Status::PLAYING,
        };

        let has_untouched_cells = self
            .cells
            .iter()
            .filter(|&item| !item.dirty)
            .collect::<Vec<_>>()
            .len()
            > 0;

        if !has_untouched_cells {
            status = Status::WON;
        }

        self.status = Some(status);
    }

    pub fn is_paused(&self) -> bool {
        let status = self.status.as_ref();

        match status {
            Some(value) => value == &Status::PAUSED,
            None => false,
        }
    }
}
