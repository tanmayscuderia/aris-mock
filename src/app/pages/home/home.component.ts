import { Component, OnInit, ViewEncapsulation, ViewChild, Input, TemplateRef } from '@angular/core';
import * as d3 from 'd3';
import { BarComponent } from '../bar/bar.component';
import { MDCDialog, MDCDialogFoundation, util } from '@material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { FormGroup, FormControl } from '@angular/forms';
import {
  AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument
} from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

export class DeliveryMetric {
  state: string;
  stateDisplayValue: string;
  mean: number;
  stdDev: number;

  constructor(stateIn, stateDisplayValueIn, meanIn, stdDevIn) {
    this.state = stateIn;
    this.stateDisplayValue = stateDisplayValueIn;
    this.mean = meanIn;
    this.stdDev = stdDevIn;
  }
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class HomeComponent implements OnInit {
  @Input() admin = false;
  chartData: number[] = [];
  deliveryMetrics: DeliveryMetric[];
  displayedColumns = ['legend', 'stateDisplayValue', 'mean', 'stdDev'];

  refreshInterval;
  @ViewChild('barCt', { static: true }) chart: BarComponent;
  @ViewChild('editDig') editDig: TemplateRef<any>;
  @ViewChild('graphDig') graphDig: TemplateRef<any>;

  fCard = {
    id: '',
    description: `Our decision to upgrade to LifeSphere MultiVigilance costs, was based on better integration, improved case management,
    reduced and the ability to reach even higher compliance requirements of our customers and regulators.`,
    position: 'Chairman of the Board',
    writer: 'Ravi Menon'
  };

  editFormGroup: FormGroup = new FormGroup({
    id: new FormControl(''),
    description: new FormControl(''),
    position: new FormControl(''),
    writer: new FormControl(''),
  });

  graphFormGroup: FormGroup = new FormGroup({
    data: new FormControl('')
  });

  cardData: any;
  cardId: any;
  cardsColl: AngularFirestoreCollection<any>;
  cardOpened: number;
  pieData: any;
  constructor(private dialog: MatDialog, private fire: AngularFirestore) { }

  ngOnInit() {
    console.log(this.admin);
    this.refreshInterval = setInterval(() => {
      if (document.hasFocus()) {
        // this.updateStates();
        this.chart.data = [...this.chartData];
      }
    }, 1000);
    this.cardsColl = this.fire.collection('cards');
    this.cardsColl.snapshotChanges().pipe(map(elements => {
      return elements.map(snap => {
        const data = snap.payload.doc.data();
        const name = snap.payload.doc.id;
        return { name, ...data };
      });
    })).subscribe(element => {
      this.cardData = element;
    });

    this.fire.doc('graphs/pie1').valueChanges().subscribe(element => {
      this.pieData = element;
    });
  }

  gridCardClicked(id) {
    if (this.admin) {
      this.cardOpened = Number(id);
      const digRef = this.dialog.open(this.editDig, {});
      digRef.afterOpened().subscribe(result => {
        this.editFormGroup.controls.description.setValue(this.cardData[id].description.toString());
      });
    }
  }
  onEditDigClick(action) {
    if (action) {
      // console.log(this.editFormGroup.controls.description.value);
      // console.log('o', this.cardData[this.cardOpened]);
      this.fire.doc(`cards/${this.cardData[this.cardOpened].name}`).update({ description: this.editFormGroup.controls.description.value });
    }
    this.dialog.closeAll();
  }

  graphClicked() {
    const digRef = this.dialog.open(this.graphDig, {});
  }

  onGraphDigClick(action) {
    if (action) {
      const arr = this.graphFormGroup.controls.data.value.split(',').map(Number);
      this.fire.doc('graphs/pie1').update({data: arr});
    }

    this.dialog.closeAll();
  }
  generateData() {
    this.chartData = [];
    this.deliveryMetrics = [];
    const meanPrepTime = randomInt(10, 11);
    const meanWaitTime = randomInt(8, 9);
    const meanTransitTime = randomInt(9, 10);

    const meanTotalTime = meanPrepTime + meanWaitTime + meanTransitTime;

    const sigmaPrepTime = randomInt(1, 1);
    const sigmaWaitTime = randomInt(2, 3);
    const sigmaTransitTime = randomInt(1, 2);

    const sigmaTotalTime = Math.floor(
      Math.sqrt(Math.pow(sigmaPrepTime, 2) +
        Math.pow(sigmaWaitTime, 2) +
        Math.pow(sigmaTransitTime, 2))
    );

    this.deliveryMetrics.push(new DeliveryMetric(
      'preparing',
      'Preparation',
      meanPrepTime,
      sigmaPrepTime
    ));
    this.deliveryMetrics.push(new DeliveryMetric(
      'ready',
      'Waiting',
      meanWaitTime,
      sigmaWaitTime
    ));
    this.deliveryMetrics.push(new DeliveryMetric(
      'inTransit',
      'In Transit',
      meanTransitTime,
      sigmaTransitTime
    ));
    this.deliveryMetrics.push(new DeliveryMetric(
      'delivered',
      'Total delivery',
      meanTotalTime,
      sigmaTotalTime
    ));

    const prandomizer = d3.randomNormal(meanPrepTime, sigmaPrepTime);
    const wrandomizer = d3.randomNormal(meanWaitTime, sigmaWaitTime);
    const trandomizer = d3.randomNormal(meanTransitTime, sigmaTransitTime);

    const ptimes = [];
    const wtimes = [];
    const ttimes = [];
    const totaltimes = [];
    for (let i = 0; i < 500; i++) {
      const p = Math.floor(prandomizer());
      const w = Math.floor(wrandomizer());
      const t = Math.floor(trandomizer());
      const total = p + w + t;
      ptimes.push(p);
      wtimes.push(w);
      ttimes.push(t);
      totaltimes.push(total);
    }
    // this.chartData.push(ptimes);
    // this.chartData.push(wtimes);
    // this.chartData.push(ttimes);
    // this.chartData.push(totaltimes);
  }

  // updateStates() {
  //   const increment = (val, plus, minus) => {
  //     return val + plus - minus;
  //   };
  //   const newOrders = randomInt(0, 10);
  //   const newReady = randomInt(0, Math.min(10, this.orderStates[0].count));
  //   const newTransit = randomInt(0, Math.min(10, this.orderStates[1].count));
  //   const newDelivered = randomInt(0, Math.min(10, this.orderStates[2].count));
  //   this.orderStates[0].count = increment(this.orderStates[0].count, newOrders, newReady);
  //   this.orderStates[1].count = increment(this.orderStates[1].count, newReady, newTransit);
  //   this.orderStates[2].count = increment(this.orderStates[2].count, newTransit, newDelivered);
  //   this.orderStates[3].count = increment(this.orderStates[3].count, newDelivered, 0);
  //   this.chartData = [];
  //   this.orderStates.forEach((state) => {
  //     this.chartData.push(state.count);
  //   });
  // }

}
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
