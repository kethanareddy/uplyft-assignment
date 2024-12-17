import React, { useEffect, useState, useRef } from 'react';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ChevronDownIcon } from 'primereact/icons/chevrondown';
import axios from 'axios';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string | null;
  date_start: number | null;
  date_end: number | null;
}

const DataTableComponent: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<{ [key: string]: boolean }>({});
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [inputRows, setInputRows] = useState<string>(''); // Input as string
  const [remainingRowsToSelect, setRemainingRowsToSelect] = useState<number>(0);
  const overlayPanelRef = useRef<OverlayPanel>(null);

  const API_URL = 'https://api.artic.edu/api/v1/artworks';

  useEffect(() => {
    loadArtworks(page);
  }, [page]);

  const loadArtworks = async (currentPage: number) => {
    const response = await axios.get(`${API_URL}?page=${currentPage}`);
    const data = response.data;
    console.log(data.data.length);
    setArtworks(
      data.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        place_of_origin: item.place_of_origin,
        artist_display: item.artist_display,
        inscriptions: item.inscriptions,
        date_start: item.date_start,
        date_end: item.date_end,
      }))
    );
    setTotalRecords(data.pagination.total);
  };

  const handleRowSelection = (rowId: number) => {
    setSelectedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const handleSelectAll = () => {
    const allSelected = !isAllSelected;
    setIsAllSelected(allSelected);

    const updatedSelections = allSelected
      ? Object.fromEntries(artworks.map((row) => [row.id, true]))
      : {};
    setSelectedRows(updatedSelections);
  };

  const isRowSelected = (rowId: number) => !!selectedRows[rowId];

  const handlePageChange = async (e: DataTablePageEvent) => {
    if (e.page !== undefined) {
      setPage(e.page + 1); // Increment to match 1-based page index

      if (remainingRowsToSelect > 0) {
        // Load the next page's data
        const response = await axios.get(`${API_URL}?page=${e.page + 1}`);
        const data = response.data;
        const newArtworks = data.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          place_of_origin: item.place_of_origin,
          artist_display: item.artist_display,
          inscriptions: item.inscriptions,
          date_start: item.date_start,
          date_end: item.date_end,
        }));

        const selected: { [key: string]: boolean } = { ...selectedRows };
        let remainingRows = remainingRowsToSelect;

        // Loop through the new artworks and select rows until remainingRows is 0
        for (let i = 0; i < newArtworks.length && remainingRows > 0; i++) {
          if (!selected[newArtworks[i].id]) {
            selected[newArtworks[i].id] = true;
            remainingRows--;
          }
        }

        setRemainingRowsToSelect(remainingRows); // Update the remaining rows to select
        setSelectedRows(selected); // Update the selected rows

        if (remainingRows === 0) {
          console.log('Row selection complete.');
        }
      }
    }
  };

const handleSelectRows = async () => {
    const numberOfRows = parseInt(inputRows, 10);
    if (isNaN(numberOfRows) || numberOfRows <= 0 || numberOfRows > totalRecords) {
        alert('Please enter a valid number of rows.');
        return;
    }

    const selected: { [key: string]: boolean } = { ...selectedRows };
    let selectedCount = Object.keys(selected).length;
    let remainingRows = numberOfRows - selectedCount;

    let currentPage = page; // Start with the current page
    let artworksInPage = [...artworks]; // Current page rows

    while (remainingRows > 0) {
        // Check if current page has unselected rows
        const unselectedRowsInPage = artworksInPage.filter(artwork => !selected[artwork.id]);
        if (unselectedRowsInPage.length > 0) {
            // Loop through unselected rows in the current page
            for (let i = 0; i < unselectedRowsInPage.length && remainingRows > 0; i++) {
                selected[unselectedRowsInPage[i].id] = true;
                selectedCount++;
                remainingRows--;
            }
        } else {
            // If no unselected rows remain, fetch the next page
            currentPage++;
            try {
                const response = await axios.get(`${API_URL}?page=${currentPage}`);
                const data = response.data;

                // Update artworksInPage with the newly fetched rows
                artworksInPage = data.data.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    place_of_origin: item.place_of_origin,
                    artist_display: item.artist_display,
                    inscriptions: item.inscriptions,
                    date_start: item.date_start,
                    date_end: item.date_end,
                }));
            } catch (error) {
                console.error('Error fetching rows from the next page:', error);
                break; // Exit the loop if fetching fails
            }
        }
    }

    // Step 2: Update the state with the selected rows
    setSelectedRows(selected);

    // If there are no remaining rows to select, hide the overlay panel
    if (remainingRows === 0) {
        console.log('Row selection complete.');
        overlayPanelRef.current?.hide();
    } else {
        console.log(`Rows remaining to select: ${remainingRows}`);
    }
};

  

  const handleChevronClick = (e: React.SyntheticEvent) => {
    overlayPanelRef.current?.show(e, e.currentTarget as HTMLElement);
  };

   return (
    <div className="datatable">
      <DataTable
        value={artworks}
        paginator
        rows={12}
        totalRecords={totalRecords}
        lazy
        first={(page - 1) * 12}
        onPage={handlePageChange}
      >
        <Column
          header={
            <div>
              <Checkbox checked={isAllSelected} onChange={handleSelectAll} />
              <ChevronDownIcon className="select-chevron" onClick={handleChevronClick} />
            </div>
          }
          body={(rowData) => (
            <Checkbox
              checked={isRowSelected(rowData.id)}
              onChange={() => handleRowSelection(rowData.id)}
            />
          )}
        />
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>

      <OverlayPanel ref={overlayPanelRef} appendTo="self">
        <div className="input-container">
          <input
            type="text"
            value={inputRows}
            onChange={(e) => setInputRows(e.target.value)}
            placeholder="Select rows"
          /><br></br><br></br>
          <button onClick={handleSelectRows}>Submit</button>
        </div>
      </OverlayPanel>
    </div>
  );
};

export default DataTableComponent;
